import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateReservationDto } from './create-reservation.dto.js';

/**
 * While a reservation is still active the driver may change the plate number
 * or the time window. Changing the space means cancelling and booking again.
 */
export class UpdateReservationDto extends PartialType(
  OmitType(CreateReservationDto, ['spaceId'] as const),
) {}
