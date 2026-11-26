import { IsOptional, IsString, MaxLength } from 'class-validator';

/** GET /parking-lots?search=... (matches name or address) */
export class QueryParkingLotDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
