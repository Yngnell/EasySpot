import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { SpaceStatus, SpaceType } from '../enums/space.enums.js';

/** GET /parking-spaces?lotId=1&status=available&type=regular */
export class QueryParkingSpaceDto {
  @IsOptional()
  @Type(() => Number) // query strings arrive as text: "1" -> 1
  @IsInt()
  @Min(1)
  lotId?: number;

  @IsOptional()
  @IsEnum(SpaceStatus)
  status?: SpaceStatus;

  @IsOptional()
  @IsEnum(SpaceType)
  type?: SpaceType;
}
