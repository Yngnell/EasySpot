import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class CreateParkingLotDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  longitude: number;

  @Matches(TIME_PATTERN, { message: 'openingTime must be in HH:MM format' })
  openingTime: string;

  @Matches(TIME_PATTERN, { message: 'closingTime must be in HH:MM format' })
  closingTime: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourlyRate: number;
}
