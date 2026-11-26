import { OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from '../../users/dto/create-user.dto.js';

/**
 * Public sign-up. The role field is removed on purpose: anyone who registers
 * becomes a driver. Attendants and admins are created by an admin via /users.
 */
export class RegisterDto extends OmitType(CreateUserDto, ['role'] as const) {}
