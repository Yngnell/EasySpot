import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto.js';

/** All fields optional; validation rules are inherited from CreateUserDto. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
