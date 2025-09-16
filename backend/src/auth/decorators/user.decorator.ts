import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '../types/auth.types';

export const User = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new Error(
        'User not found in request. Make sure JwtAuthGuard is applied.'
      );
    }

    return data ? user[data] : user;
  }
);
