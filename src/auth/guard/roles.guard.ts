import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, User } from '@prisma/client';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { AuthError } from '../error/auth.error';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: User }>();

    if (!requiredRoles.includes(user.role)) {
      throw AuthError.InsufficientRole();
    }

    return true;
  }
}
