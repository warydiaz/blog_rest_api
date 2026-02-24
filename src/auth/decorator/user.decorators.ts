import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, User } from '@prisma/client';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();

    return request.user;
  },
);

export const GetUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Role => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();

    return request.user.role;
  },
);

export const GetUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();

    return request.user.id;
  },
);
