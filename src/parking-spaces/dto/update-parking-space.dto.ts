import { PartialType } from '@nestjs/mapped-types';
import { CreateParkingSpaceDto } from './create-parking-space.dto.js';

export class UpdateParkingSpaceDto extends PartialType(CreateParkingSpaceDto) {}
