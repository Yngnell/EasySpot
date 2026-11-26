import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import { CreateParkingLotDto } from './dto/create-parking-lot.dto.js';
import { QueryParkingLotDto } from './dto/query-parking-lot.dto.js';
import { UpdateParkingLotDto } from './dto/update-parking-lot.dto.js';
import { ParkingLotsService } from './parking-lots.service.js';

@Controller('parking-lots')
export class ParkingLotsController {
  constructor(private readonly lotsService: ParkingLotsService) {}

  // GET /parking-lots?search= -> 200   (any logged-in user)
  @Get()
  findAll(@Query() query: QueryParkingLotDto) {
    return this.lotsService.findAll(query);
  }

  // GET /parking-lots/:id -> 200 | 404   (any logged-in user)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lotsService.findOne(id);
  }

  // POST /parking-lots -> 201 | 400 | 409   (admin)
  @Roles(Role.Admin)
  @Post()
  create(@Body() dto: CreateParkingLotDto) {
    return this.lotsService.create(dto);
  }

  // PATCH /parking-lots/:id -> 200 | 400 | 404 | 409   (admin)
  @Roles(Role.Admin)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParkingLotDto,
  ) {
    return this.lotsService.update(id, dto);
  }

  // DELETE /parking-lots/:id -> 204 | 404   (admin)
  @Roles(Role.Admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lotsService.remove(id);
  }
}
