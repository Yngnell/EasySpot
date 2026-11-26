import { IsDateString, IsInt, Matches, Min } from 'class-validator';

export class CreateReservationDto {
  @IsInt()
  @Min(1)
  spaceId: number;

  @Matches(/^[A-Za-z0-9 -]{2,15}$/, {
    message: 'plateNumber must be 2-15 letters, numbers, spaces or dashes',
  })
  plateNumber: string;

  /** ISO 8601 date-time, e.g. 2026-12-01T09:00:00+08:00 */
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
