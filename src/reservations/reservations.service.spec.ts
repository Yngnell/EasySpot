import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum.js';
import { AuthUser } from '../common/interfaces/auth-user.interface.js';
import { SpaceStatus } from '../parking-spaces/enums/space.enums.js';
import { ReservationStatus } from './enums/reservation-status.enum.js';
import { ReservationsService } from './reservations.service.js';

const HOUR = 60 * 60 * 1000;
const driver: AuthUser = {
  sub: 1,
  email: 'driver@test.com',
  role: Role.Driver,
};
const otherDriver: AuthUser = {
  sub: 2,
  email: 'x@test.com',
  role: Role.Driver,
};

function setup() {
  const queryBuilder = {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    getExists: vi.fn().mockResolvedValue(false),
  };
  const manager = {
    findOne: vi.fn(),
    existsBy: vi.fn().mockResolvedValue(false),
    create: vi.fn((_entity: unknown, data: object) => data),
    save: vi.fn((data: object) => Promise.resolve({ ...data, id: 10 })),
    update: vi.fn(),
    delete: vi.fn(),
    getRepository: vi.fn(() => ({ createQueryBuilder: () => queryBuilder })),
  };
  const dataSource = {
    manager,
    transaction: vi.fn((work: (m: typeof manager) => unknown) => work(manager)),
  };
  const repository = { findOne: vi.fn(), find: vi.fn(), update: vi.fn() };

  const service = new ReservationsService(
    repository as never,
    dataSource as never,
  );
  return { service, manager, repository, queryBuilder };
}

function bookingFromNow(startInHours: number, lengthHours: number) {
  const start = new Date(Date.now() + startInHours * HOUR);
  const end = new Date(start.getTime() + lengthHours * HOUR);
  return {
    spaceId: 5,
    plateNumber: 'abc 1234',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

describe('ReservationsService', () => {
  describe('create', () => {
    it('books an available space and marks it reserved', async () => {
      const { service, manager, repository } = setup();
      manager.findOne.mockResolvedValue({
        id: 5,
        code: 'A-01',
        status: SpaceStatus.Available,
      });
      repository.findOne.mockResolvedValue({ id: 10 });

      await service.create(bookingFromNow(1, 2), driver);

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          spaceId: 5,
          plateNumber: 'ABC 1234',
          status: ReservationStatus.Active,
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(expect.anything(), 5, {
        status: SpaceStatus.Reserved,
      });
    });

    it('rejects an end time before the start time with 400', async () => {
      const { service } = setup();
      await expect(
        service.create(bookingFromNow(2, -1), driver),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a start time in the past with 400', async () => {
      const { service } = setup();
      await expect(
        service.create(bookingFromNow(-3, 1), driver),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a booking longer than 24 hours with 400', async () => {
      const { service } = setup();
      await expect(
        service.create(bookingFromNow(1, 25), driver),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a space that is not available with 409', async () => {
      const { service, manager } = setup();
      manager.findOne.mockResolvedValue({
        id: 5,
        code: 'A-01',
        status: SpaceStatus.Occupied,
      });
      await expect(
        service.create(bookingFromNow(1, 2), driver),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a second open reservation for the same driver with 409', async () => {
      const { service, manager } = setup();
      manager.findOne.mockResolvedValue({
        id: 5,
        code: 'A-01',
        status: SpaceStatus.Available,
      });
      manager.existsBy.mockResolvedValue(true);
      await expect(
        service.create(bookingFromNow(1, 2), driver),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an overlapping booking with 409', async () => {
      const { service, manager, queryBuilder } = setup();
      manager.findOne.mockResolvedValue({
        id: 5,
        code: 'A-01',
        status: SpaceStatus.Available,
      });
      queryBuilder.getExists.mockResolvedValue(true);
      await expect(
        service.create(bookingFromNow(1, 2), driver),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne', () => {
    it("blocks a driver from reading another driver's reservation", async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValue({ id: 10, userId: driver.sub });
      await expect(service.findOne(10, otherDriver)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lets an attendant read any reservation', async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValue({ id: 10, userId: driver.sub });
      const attendant: AuthUser = {
        sub: 9,
        email: 'att@test.com',
        role: Role.Attendant,
      };
      await expect(service.findOne(10, attendant)).resolves.toMatchObject({
        id: 10,
      });
    });
  });

  describe('complete', () => {
    it('charges every started hour at the lot rate and frees the space', async () => {
      const { service, manager, repository } = setup();
      repository.findOne.mockResolvedValue({
        id: 10,
        spaceId: 5,
        status: ReservationStatus.CheckedIn,
        checkedInAt: new Date(Date.now() - 2.5 * HOUR), // 2.5 h -> 3 hours
        startTime: new Date(),
        space: { lot: { hourlyRate: 40 } },
      });

      await service.complete(10);

      expect(manager.update).toHaveBeenCalledWith(
        expect.anything(),
        10,
        expect.objectContaining({
          status: ReservationStatus.Completed,
          totalFee: 120,
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(expect.anything(), 5, {
        status: SpaceStatus.Available,
      });
    });

    it('rejects completing a reservation that was never checked in', async () => {
      const { service, repository } = setup();
      repository.findOne.mockResolvedValue({
        id: 10,
        status: ReservationStatus.Active,
      });
      await expect(service.complete(10)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
