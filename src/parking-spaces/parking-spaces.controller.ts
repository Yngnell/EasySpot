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
import { CreateParkingSpaceDto } from './dto/create-parking-space.dto.js';
import { QueryParkingSpaceDto } from './dto/query-parking-space.dto.js';
import { UpdateParkingSpaceDto } from './dto/update-parking-space.dto.js';
import { UpdateSpaceStatusDto } from './dto/update-space-status.dto.js';
import { ParkingSpacesService } from './parking-spaces.service.js';

@Controller('parking-spaces')
export class ParkingSpacesController {
  constructor(private readonly spacesService: ParkingSpacesService) {}

  // GET /parking-spaces?lotId=&status=&type= -> 200   (any logged-in user)
  @Get()
  findAll(@Query() query: QueryParkingSpaceDto) {
    return this.spacesService.findAll(query);
  }

  // GET /parking-spaces/available?lotId=&type= -> 200   (any logged-in user)
  // Declared before ':id' so "available" is not treated as an id.
  @Get('available')
  findAvailable(@Query() query: QueryParkingSpaceDto) {
    return this.spacesService.findAvailable(query);
  }

  // GET /parking-spaces/:id -> 200 | 404   (any logged-in user)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.findOne(id);
  }

  // POST /parking-spaces -> 201 | 400 | 404 | 409   (admin)
  @Roles(Role.Admin)
  @Post()
  create(@Body() dto: CreateParkingSpaceDto) {
    return this.spacesService.create(dto);
  }

  // PATCH /parking-spaces/:id -> 200 | 400 | 404 | 409   (admin)
  @Roles(Role.Admin)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParkingSpaceDto,
  ) {
    return this.spacesService.update(id, dto);
  }

  // PATCH /parking-spaces/:id/status -> 200 | 400 | 404   (attendant, admin)
  @Roles(Role.Attendant, Role.Admin)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpaceStatusDto,
  ) {
    return this.spacesService.updateStatus(id, dto.status);
  }

  // DELETE /parking-spaces/:id -> 204 | 404   (admin)
  @Roles(Role.Admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.spacesService.remove(id);
  }
}
