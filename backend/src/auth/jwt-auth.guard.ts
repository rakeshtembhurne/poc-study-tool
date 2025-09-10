import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedException('No authorization header');
      }

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer') {
        throw new UnauthorizedException('Invalid authorization type');
      }

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const payload = await this.authService.verifyToken(token);
      request.user = payload;

      return true;
    } catch (error) {
      this.logger.error(
        `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new UnauthorizedException('Invalid token');
    }
  }
}
