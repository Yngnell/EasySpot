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
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import type { AuthUser } from '../common/interfaces/auth-user.interface.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { QueryReservationDto } from './dto/query-reservation.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // GET /reservations?status=&spaceId=&userId= -> 200   (attendant, admin)
  @Roles(Role.Attendant, Role.Admin)
  @Get()
  findAll(@Query() query: QueryReservationDto) {
    return this.reservationsService.findAll(query);
  }

  // GET /reservations/me -> 200   (any logged-in user: their own bookings)
  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.reservationsService.findMine(user);
  }

  // GET /reservations/:id -> 200 | 403 | 404   (owner or staff)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservationsService.findOne(id, user);
  }

  // POST /reservations -> 201 | 400 | 404 | 409   (driver)
  @Roles(Role.Driver)
  @Post()
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: AuthUser) {
    return this.reservationsService.create(dto, user);
  }

  // PATCH /reservations/:id -> 200 | 400 | 403 | 404 | 409   (owner or staff)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.reservationsService.update(id, dto, user);
  }

  // PATCH /reservations/:id/cancel -> 200 | 403 | 404 | 409   (owner or staff)
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.reservationsService.cancel(id, user);
  }

  // PATCH /reservations/:id/check-in -> 200 | 404 | 409   (attendant, admin)
  @Roles(Role.Attendant, Role.Admin)
  @Patch(':id/check-in')
  checkIn(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.checkIn(id);
  }

  // PATCH /reservations/:id/complete -> 200 | 404 | 409   (attendant, admin)
  @Roles(Role.Attendant, Role.Admin)
  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.complete(id);
  }

  // DELETE /reservations/:id -> 204 | 404   (admin)
  @Roles(Role.Admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.remove(id);
  }
}
