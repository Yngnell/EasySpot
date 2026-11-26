/**
 * Fills the database with demo data for testing and the demo video.
 * Run with: npm run seed
 *
 * Safe to run more than once: records that already exist are skipped.
 * The demo accounts' password is read from SEED_PASSWORD in .env.
 */
import { ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { Role } from '../common/enums/role.enum.js';
import { ParkingLotsService } from '../parking-lots/parking-lots.service.js';
import { SpaceType } from '../parking-spaces/enums/space.enums.js';
import { ParkingSpacesService } from '../parking-spaces/parking-spaces.service.js';
import { UsersService } from '../users/users.service.js';

const logger = new Logger('Seed');

const USERS = [
  { fullName: 'System Admin', email: 'admin@easyspot.local', role: Role.Admin },
  {
    fullName: 'Parking Attendant',
    email: 'attendant@easyspot.local',
    role: Role.Attendant,
  },
  {
    fullName: 'Demo Driver',
    email: 'driver@easyspot.local',
    role: Role.Driver,
    phone: '09171234567',
  },
];

const LOTS = [
  {
    lot: {
      name: 'Central Plaza Parking',
      address: 'Central Plaza, Main Street',
      latitude: 14.5995,
      longitude: 120.9842,
      openingTime: '06:00',
      closingTime: '22:00',
      hourlyRate: 40,
    },
    spaces: [
      { code: 'A-01', type: SpaceType.Regular },
      { code: 'A-02', type: SpaceType.Regular },
      { code: 'A-03', type: SpaceType.Regular },
      { code: 'A-04', type: SpaceType.Compact },
      { code: 'A-05', type: SpaceType.Pwd },
      { code: 'A-06', type: SpaceType.Ev },
    ],
  },
  {
    lot: {
      name: 'Riverside Parking',
      address: 'Riverside Avenue',
      latitude: 14.5869,
      longitude: 120.9767,
      openingTime: '07:00',
      closingTime: '21:00',
      hourlyRate: 30,
    },
    spaces: [
      { code: 'B-01', type: SpaceType.Regular },
      { code: 'B-02', type: SpaceType.Regular },
      { code: 'B-03', type: SpaceType.Motorcycle },
      { code: 'B-04', type: SpaceType.Motorcycle },
    ],
  },
];

/** Runs a create call and treats "already exists" (409) as a skip. */
async function createOrSkip(label: string, create: () => Promise<unknown>) {
  try {
    await create();
    logger.log(`created  ${label}`);
  } catch (error) {
    if (error instanceof ConflictException) {
      logger.log(`skipped  ${label} (already exists)`);
      return;
    }
    throw error;
  }
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const password = app.get(ConfigService).getOrThrow<string>('SEED_PASSWORD');
    const users = app.get(UsersService);
    const lots = app.get(ParkingLotsService);
    const spaces = app.get(ParkingSpacesService);

    for (const user of USERS) {
      await createOrSkip(`user ${user.email}`, () =>
        users.create({ ...user, password }),
      );
    }

    for (const { lot, spaces: lotSpaces } of LOTS) {
      await createOrSkip(`lot "${lot.name}"`, () => lots.create(lot));
      const [savedLot] = await lots.findAll({ search: lot.name });

      for (const space of lotSpaces) {
        await createOrSkip(`space ${space.code}`, () =>
          spaces.create({ lotId: savedLot.id, ...space }),
        );
      }
    }

    logger.log('Done. Log in with the demo emails and SEED_PASSWORD from .env');
  } finally {
    await app.close();
  }
}

await seed();
