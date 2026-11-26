import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { SpaceType } from '../enums/space.enums.js';

export class CreateParkingSpaceDto {
  @IsInt()
  @Min(1)
  lotId: number;

  @Matches(/^[A-Za-z0-9-]{1,10}$/, {
    message: 'code must be 1-10 letters, numbers or dashes (e.g. A-01)',
  })
  code: string;

  @IsOptional()
  @IsEnum(SpaceType)
  type?: SpaceType;
}
