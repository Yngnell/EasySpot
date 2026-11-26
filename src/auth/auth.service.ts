import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { Role } from '../common/enums/role.enum.js';
import { AuthUser } from '../common/interfaces/auth-user.interface.js';
import { User } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  user: User;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  register(dto: RegisterDto): Promise<User> {
    return this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      password: dto.password,
      phone: dto.phone,
      role: Role.Driver,
    });
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // Same message for "no such email" and "wrong password" so attackers
    // cannot find out which emails are registered.
    const passwordMatches =
      user !== null && (await compare(dto.password, user.password));
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: AuthUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      token_type: 'Bearer',
      user: await this.usersService.findOne(user.id),
    };
  }

  profile(authUser: AuthUser): Promise<User> {
    return this.usersService.findOne(authUser.sub);
  }
}
