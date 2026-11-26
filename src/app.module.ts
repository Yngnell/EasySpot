import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { buildDatabaseConfig } from './config/database.config.js';
import { ParkingLotsModule } from './parking-lots/parking-lots.module.js';
import { ParkingSpacesModule } from './parking-spaces/parking-spaces.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    // Loads variables from .env and makes ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),
    // MySQL connection through TypeORM
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildDatabaseConfig,
    }),
    UsersModule,
    AuthModule,
    ParkingLotsModule,
    ParkingSpacesModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
