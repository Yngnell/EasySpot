import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ParkingLotsService } from '../parking-lots/parking-lots.service.js';
import { CreateParkingSpaceDto } from './dto/create-parking-space.dto.js';
import { QueryParkingSpaceDto } from './dto/query-parking-space.dto.js';
import { UpdateParkingSpaceDto } from './dto/update-parking-space.dto.js';
import { ParkingSpace } from './entities/parking-space.entity.js';
import { SpaceStatus } from './enums/space.enums.js';

@Injectable()
export class ParkingSpacesService {
  constructor(
    @InjectRepository(ParkingSpace)
    private readonly spacesRepository: Repository<ParkingSpace>,
    private readonly lotsService: ParkingLotsService,
  ) {}

  findAll(query: QueryParkingSpaceDto): Promise<ParkingSpace[]> {
    const where: FindOptionsWhere<ParkingSpace> = {};
    if (query.lotId) where.lotId = query.lotId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    return this.spacesRepository.find({
      where,
      relations: { lot: true },
      order: { lotId: 'ASC', code: 'ASC' },
    });
  }

  /** Free spaces right now: what a driver sees before reserving. */
  findAvailable(query: QueryParkingSpaceDto): Promise<ParkingSpace[]> {
    return this.findAll({
      lotId: query.lotId,
      type: query.type,
      status: SpaceStatus.Available,
    });
  }

  /** GET /parking-lots/:id/spaces */
  async findByLot(lotId: number): Promise<ParkingSpace[]> {
    await this.lotsService.findOne(lotId); // 404 if the lot does not exist
    return this.spacesRepository.find({
      where: { lotId },
      order: { code: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ParkingSpace> {
    const space = await this.spacesRepository.findOne({
      where: { id },
      relations: { lot: true },
    });
    if (!space) {
      throw new NotFoundException(`Parking space #${id} not found`);
    }
    return space;
  }

  async create(dto: CreateParkingSpaceDto): Promise<ParkingSpace> {
    await this.lotsService.findOne(dto.lotId);
    const code = dto.code.toUpperCase();
    await this.ensureCodeIsFree(dto.lotId, code);

    const space = this.spacesRepository.create({
      lotId: dto.lotId,
      code,
      type: dto.type,
    });
    const saved = await this.spacesRepository.save(space);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateParkingSpaceDto): Promise<ParkingSpace> {
    const space = await this.findOne(id);
    const lotId = dto.lotId ?? space.lotId;
    const code = dto.code?.toUpperCase() ?? space.code;

    if (dto.lotId && dto.lotId !== space.lotId) {
      await this.lotsService.findOne(dto.lotId);
    }
    if (lotId !== space.lotId || code !== space.code) {
      await this.ensureCodeIsFree(lotId, code);
    }

    await this.spacesRepository.update(id, {
      lotId,
      code,
      type: dto.type ?? space.type,
    });
    return this.findOne(id);
  }

  async updateStatus(id: number, status: SpaceStatus): Promise<ParkingSpace> {
    await this.findOne(id);
    await this.spacesRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const space = await this.findOne(id);
    await this.spacesRepository.remove(space);
  }

  private async ensureCodeIsFree(lotId: number, code: string): Promise<void> {
    if (await this.spacesRepository.existsBy({ lotId, code })) {
      throw new ConflictException(
        `Space "${code}" already exists in parking lot #${lotId}`,
      );
    }
  }
}
