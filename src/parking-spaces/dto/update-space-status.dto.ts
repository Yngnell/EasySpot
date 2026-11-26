import { IsEnum } from 'class-validator';
import { SpaceStatus } from '../enums/space.enums.js';

/** Used by attendants to update a space on the ground (e.g. occupied, maintenance). */
export class UpdateSpaceStatusDto {
  @IsEnum(SpaceStatus)
  status: SpaceStatus;
}
