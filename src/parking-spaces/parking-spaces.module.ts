import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLotsModule } from '../parking-lots/parking-lots.module.js';
import { ParkingSpace } from './entities/parking-space.entity.js';
import { LotSpacesController } from './lot-spaces.controller.js';
import { ParkingSpacesController } from './parking-spaces.controller.js';
import { ParkingSpacesService } from './parking-spaces.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingSpace]), ParkingLotsModule],
  controllers: [ParkingSpacesController, LotSpacesController],
  providers: [ParkingSpacesService],
  exports: [ParkingSpacesService],
})
export class ParkingSpacesModule {}
