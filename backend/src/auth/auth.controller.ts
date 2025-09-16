import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return local[0] + '***@' + domain;
}
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: RegisterDto) {
    this.logger.log(`Signup attempt for email: ${maskEmail(dto.email)}`);
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Signup attempt for email: ${maskEmail(dto.email)}`);
    return this.authService.login(dto);
  }

  @Post('refresh-token')
  @HttpCode(200)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.logger.log(
      `Password reset request for email: ${maskEmail(dto.email)}`
    );
    return this.authService.resetPassword(dto.email);
  }

  @Post('reset-password/confirm')
  @HttpCode(200)
  async resetPasswordConfirm(
    @Body() body: { resetToken: string; newPassword: string }
  ) {
    return this.authService.resetPasswordConfirm(
      body.resetToken,
      body.newPassword
    );
  }
}
