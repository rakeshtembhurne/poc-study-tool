import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthPayload } from '../types/auth.types';

export const User = createParamDecorator(
  (data: keyof AuthPayload | undefined, ctx: ExecutionContext): AuthPayload => {
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
