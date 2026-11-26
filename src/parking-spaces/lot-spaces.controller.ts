import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ParkingSpacesService } from './parking-spaces.service.js';

/** Nested resource: the spaces that belong to one parking lot. */
@Controller('parking-lots/:lotId/spaces')
export class LotSpacesController {
  constructor(private readonly spacesService: ParkingSpacesService) {}

  // GET /parking-lots/:lotId/spaces -> 200 | 404   (any logged-in user)
  @Get()
  findByLot(@Param('lotId', ParseIntPipe) lotId: number) {
    return this.spacesService.findByLot(lotId);
  }
}
