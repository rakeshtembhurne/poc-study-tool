import { Body, Controller, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: RegisterDto) {
    this.logger.log(`Signup attempt for email: ${dto.email}`);
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    const { userId, refreshToken } = body;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email);
  }
}
