import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ReservationStatus } from '../enums/reservation-status.enum.js';

/** GET /reservations?status=active&spaceId=1&userId=3 */
export class QueryReservationDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  spaceId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}
