import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const User = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    // Validate user object exists
    if (!request.user) {
      throw new UnauthorizedException('Invalid or missing user payload in JWT');
    }

    const userId = request.user.id;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in JWT payload');
    }

    return data ? request.user[data] : userId;
  }
);
