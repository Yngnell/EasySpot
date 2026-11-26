import { Request } from 'express';
import { Role } from '../enums/role.enum.js';

/** Data stored inside the JWT and attached to request.user after verification. */
export interface AuthUser {
  sub: number; // user id
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
