import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { Role } from '../enums/role.enum.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function reflectorWith(metadata: Record<string, unknown>): Reflector {
  return {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
}

describe('JwtAuthGuard', () => {
  const jwtService = { verifyAsync: vi.fn() };

  beforeEach(() => {
    jwtService.verifyAsync.mockReset();
  });

  it('lets @Public() routes through without a token', async () => {
    const guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      reflectorWith({ [IS_PUBLIC_KEY]: true }),
    );
    await expect(guard.canActivate(contextFor({ headers: {} }))).resolves.toBe(
      true,
    );
  });

  it('rejects a request without a token with 401', async () => {
    const guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      reflectorWith({}),
    );
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid or expired token with 401', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
    const guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      reflectorWith({}),
    );
    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer bad.token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the decoded user to the request for a valid token', async () => {
    const payload = { sub: 1, email: 'a@b.com', role: Role.Driver };
    jwtService.verifyAsync.mockResolvedValue(payload);
    const guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      reflectorWith({}),
    );
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer good.token' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toEqual(payload);
  });
});

describe('RolesGuard', () => {
  it('allows any logged-in user when the route has no @Roles()', () => {
    const guard = new RolesGuard(reflectorWith({}));
    expect(guard.canActivate(contextFor({ user: { role: Role.Driver } }))).toBe(
      true,
    );
  });

  it('allows a user whose role is listed', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.Attendant, Role.Admin] }),
    );
    expect(
      guard.canActivate(contextFor({ user: { role: Role.Attendant } })),
    ).toBe(true);
  });

  it('blocks a driver from an admin route with 403', () => {
    const guard = new RolesGuard(reflectorWith({ [ROLES_KEY]: [Role.Admin] }));
    expect(() =>
      guard.canActivate(contextFor({ user: { role: Role.Driver } })),
    ).toThrow(ForbiddenException);
  });
});
