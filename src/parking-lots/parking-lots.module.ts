import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLot } from './entities/parking-lot.entity.js';
import { ParkingLotsController } from './parking-lots.controller.js';
import { ParkingLotsService } from './parking-lots.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ParkingLot])],
  controllers: [ParkingLotsController],
  providers: [ParkingLotsService],
  exports: [ParkingLotsService],
})
export class ParkingLotsModule {}
