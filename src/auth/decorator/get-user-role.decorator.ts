import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, User } from '@prisma/client';

export const GetUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Role => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();

    return request.user.role;
  },
);
