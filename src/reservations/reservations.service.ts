import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { AuthUser } from '../common/interfaces/auth-user.interface.js';
import { ParkingSpace } from '../parking-spaces/entities/parking-space.entity.js';
import { SpaceStatus } from '../parking-spaces/enums/space.enums.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { QueryReservationDto } from './dto/query-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { Reservation } from './entities/reservation.entity.js';
import {
  OPEN_STATUSES,
  ReservationStatus,
} from './enums/reservation-status.enum.js';

const HOUR_MS = 60 * 60 * 1000;
const MAX_DURATION_MS = 24 * HOUR_MS;
const PAST_GRACE_MS = 5 * 60 * 1000; // allow a start time up to 5 minutes ago

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationsRepository: Repository<Reservation>,
    private readonly dataSource: DataSource,
  ) {}

  // ---------- Read ----------

  /** Staff view of all reservations, with optional filters. */
  findAll(query: QueryReservationDto): Promise<Reservation[]> {
    const where: FindOptionsWhere<Reservation> = {};
    if (query.status) where.status = query.status;
    if (query.spaceId) where.spaceId = query.spaceId;
    if (query.userId) where.userId = query.userId;

    return this.reservationsRepository.find({
      where,
      relations: { user: true, space: { lot: true } },
      order: { startTime: 'DESC' },
    });
  }

  /** The logged-in driver's own reservations. */
  findMine(authUser: AuthUser): Promise<Reservation[]> {
    return this.reservationsRepository.find({
      where: { userId: authUser.sub },
      relations: { space: { lot: true } },
      order: { startTime: 'DESC' },
    });
  }

  async findOne(id: number, authUser: AuthUser): Promise<Reservation> {
    const reservation = await this.getOrFail(id);
    this.assertOwnerOrStaff(reservation, authUser);
    return reservation;
  }

  // ---------- Create ----------

  async create(
    dto: CreateReservationDto,
    authUser: AuthUser,
  ): Promise<Reservation> {
    const { start, end } = this.parseWindow(dto.startTime, dto.endTime);

    // Transaction + row lock on the space: if two drivers try to book the
    // same space at the same moment, the second one waits and then gets 409.
    const id = await this.dataSource.transaction(async (manager) => {
      const space = await manager.findOne(ParkingSpace, {
        where: { id: dto.spaceId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!space) {
        throw new NotFoundException(`Parking space #${dto.spaceId} not found`);
      }
      if (space.status !== SpaceStatus.Available) {
        throw new ConflictException(
          `Parking space ${space.code} is currently ${space.status}`,
        );
      }

      const hasOpenReservation = await manager.existsBy(Reservation, {
        userId: authUser.sub,
        status: In(OPEN_STATUSES),
      });
      if (hasOpenReservation) {
        throw new ConflictException(
          'You already have an active reservation. Cancel or complete it first.',
        );
      }

      await this.ensureNoOverlap(manager, space.id, start, end);

      const reservation = manager.create(Reservation, {
        userId: authUser.sub,
        spaceId: space.id,
        plateNumber: dto.plateNumber.toUpperCase(),
        startTime: start,
        endTime: end,
        status: ReservationStatus.Active,
      });
      const saved = await manager.save(reservation);

      await manager.update(ParkingSpace, space.id, {
        status: SpaceStatus.Reserved,
      });
      return saved.id;
    });

    return this.getOrFail(id);
  }

  // ---------- Update ----------

  async update(
    id: number,
    dto: UpdateReservationDto,
    authUser: AuthUser,
  ): Promise<Reservation> {
    const reservation = await this.getOrFail(id);
    this.assertOwnerOrStaff(reservation, authUser);
    this.assertStatus(reservation, ReservationStatus.Active, 'changed');

    const changes: Partial<Reservation> = {};
    if (dto.plateNumber) {
      changes.plateNumber = dto.plateNumber.toUpperCase();
    }
    if (dto.startTime || dto.endTime) {
      const { start, end } = this.parseWindow(
        dto.startTime ?? reservation.startTime.toISOString(),
        dto.endTime ?? reservation.endTime.toISOString(),
      );
      await this.ensureNoOverlap(
        this.dataSource.manager,
        reservation.spaceId,
        start,
        end,
        reservation.id,
      );
      changes.startTime = start;
      changes.endTime = end;
    }

    if (Object.keys(changes).length > 0) {
      await this.reservationsRepository.update(id, changes);
    }
    return this.getOrFail(id);
  }

  /** Driver (owner) or staff cancels: the space becomes available again. */
  async cancel(id: number, authUser: AuthUser): Promise<Reservation> {
    const reservation = await this.getOrFail(id);
    this.assertOwnerOrStaff(reservation, authUser);
    this.assertStatus(reservation, ReservationStatus.Active, 'cancelled');

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Reservation, id, {
        status: ReservationStatus.Cancelled,
      });
      await manager.update(ParkingSpace, reservation.spaceId, {
        status: SpaceStatus.Available,
      });
    });
    return this.getOrFail(id);
  }

  /** Attendant confirms the driver arrived: the space becomes occupied. */
  async checkIn(id: number): Promise<Reservation> {
    const reservation = await this.getOrFail(id);
    this.assertStatus(reservation, ReservationStatus.Active, 'checked in');

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Reservation, id, {
        status: ReservationStatus.CheckedIn,
        checkedInAt: new Date(),
      });
      await manager.update(ParkingSpace, reservation.spaceId, {
        status: SpaceStatus.Occupied,
      });
    });
    return this.getOrFail(id);
  }

  /** Attendant marks the car as gone: computes the fee and frees the space. */
  async complete(id: number): Promise<Reservation> {
    const reservation = await this.getOrFail(id);
    this.assertStatus(reservation, ReservationStatus.CheckedIn, 'completed');

    const completedAt = new Date();
    const parkedSince = reservation.checkedInAt ?? reservation.startTime;
    // Every started hour is charged, minimum of 1 hour
    const hours = Math.max(
      1,
      Math.ceil((completedAt.getTime() - parkedSince.getTime()) / HOUR_MS),
    );
    const totalFee =
      Math.round(hours * reservation.space.lot.hourlyRate * 100) / 100;

    await this.dataSource.transaction(async (manager) => {
      await manager.update(Reservation, id, {
        status: ReservationStatus.Completed,
        completedAt,
        totalFee,
      });
      await manager.update(ParkingSpace, reservation.spaceId, {
        status: SpaceStatus.Available,
      });
    });
    return this.getOrFail(id);
  }

  // ---------- Delete ----------

  /** Admin removes a reservation record. Frees the space if it was still held. */
  async remove(id: number): Promise<void> {
    const reservation = await this.getOrFail(id);

    await this.dataSource.transaction(async (manager) => {
      if (OPEN_STATUSES.includes(reservation.status)) {
        await manager.update(ParkingSpace, reservation.spaceId, {
          status: SpaceStatus.Available,
        });
      }
      await manager.delete(Reservation, id);
    });
  }

  // ---------- Helpers ----------

  private async getOrFail(id: number): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne({
      where: { id },
      relations: { user: true, space: { lot: true } },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    return reservation;
  }

  /** Drivers can only touch their own reservations; staff can touch all. */
  private assertOwnerOrStaff(reservation: Reservation, authUser: AuthUser) {
    const isStaff =
      authUser.role === Role.Admin || authUser.role === Role.Attendant;
    if (!isStaff && reservation.userId !== authUser.sub) {
      throw new ForbiddenException('This reservation belongs to another user');
    }
  }

  private assertStatus(
    reservation: Reservation,
    expected: ReservationStatus,
    action: string,
  ) {
    if (reservation.status !== expected) {
      throw new ConflictException(
        `Reservation is ${reservation.status}; only ${expected} reservations can be ${action}`,
      );
    }
  }

  private parseWindow(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start.getTime() < Date.now() - PAST_GRACE_MS) {
      throw new BadRequestException('startTime cannot be in the past');
    }
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime');
    }
    if (end.getTime() - start.getTime() > MAX_DURATION_MS) {
      throw new BadRequestException('A reservation can last at most 24 hours');
    }
    return { start, end };
  }

  /** 409 if another open reservation on the same space overlaps [start, end). */
  private async ensureNoOverlap(
    manager: EntityManager,
    spaceId: number,
    start: Date,
    end: Date,
    excludeId?: number,
  ): Promise<void> {
    const query = manager
      .getRepository(Reservation)
      .createQueryBuilder('r')
      .where('r.space_id = :spaceId', { spaceId })
      .andWhere('r.status IN (:...statuses)', { statuses: OPEN_STATUSES })
      .andWhere('r.start_time < :end AND r.end_time > :start', { start, end });
    if (excludeId) {
      query.andWhere('r.id != :excludeId', { excludeId });
    }

    if (await query.getExists()) {
      throw new ConflictException(
        'This space is already booked for part of that time',
      );
    }
  }
}
