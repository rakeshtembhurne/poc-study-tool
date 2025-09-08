import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

interface LoginResponse {
  access_token: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    try {
      // Note: In a real application, you would fetch the user from the database here
      // and verify their credentials. This is just a demonstration.
      const hashedPassword = await this.authService.hashPassword('password');
      const isValid = await this.authService.verifyPassword(
        loginDto.password,
        hashedPassword
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      //Need to change the hardcoded user id, after fetching user from db
      const token = await this.authService.generateToken(
        'user-id',
        loginDto.email
      );
      return { access_token: token };
    } catch (error) {
      this.logger.error(
        `Error in login: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during login');
    }
  }
}
