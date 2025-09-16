import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '@/utils/mail.service';
import { AuthPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await this.hashPassword(dto.password);
    try {
      // 1. Create the user
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
        },
      });

      // 2. Generate access and refresh tokens
      const accessToken = await this.generateToken(user.id, user.email);
      const refreshToken = await this.generateRefreshToken(user.id, user.email);

      // 4. Return response with tokens
      return {
        message: 'User registered successfully',
        userId: user.id,
        email: user.email,
        accessToken,
        refreshToken,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await this.verifyPassword(
      dto.password,
      user.password
    );
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.generateToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id, user.email);

    return {
      message: 'Login successful',
      userId: user.id,
      email: user.email,
      accessToken,
      refreshToken,
    };
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;
      const salt = await bcrypt.genSalt(rounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      this.logger.error(
        `Error hashing password: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      this.logger.error(
        `Error verifying password: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new UnauthorizedException('Error verifying password');
    }
  }

  async generateToken(userId: number | string, email: string): Promise<string> {
    try {
      const payload: AuthPayload = { id: String(userId), email }; // convert to string
      return this.jwtService.sign(payload);
    } catch (error) {
      this.logger.error(
        `Error generating token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new InternalServerErrorException('Error generating token');
    }
  }
  async verifyToken(token: string, secret?: string): Promise<AuthPayload> {
    try {
      return this.jwtService.verify<AuthPayload>(token, {
        secret: secret || process.env.JWT_SECRET,
      });
    } catch (error) {
      this.logger.error(
        `Error verifying token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new UnauthorizedException('Error verifying token');
    }
  }

  async generateRefreshToken(
    userId: string | number,
    email: string,
    oldRefreshToken?: string
  ): Promise<string> {
    try {
      if (oldRefreshToken) {
        await this.verifyToken(
          oldRefreshToken,
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
      }
      const payload: AuthPayload = { id: String(userId), email };
      return this.jwtService.sign(payload, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });
    } catch (error) {
      this.logger.error(
        `Error generating refresh token: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw new InternalServerErrorException('Error generating refresh token');
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.verifyToken(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      const newAccessToken = await this.generateToken(
        payload.id,
        payload.email
      );
      const newRefreshToken = await this.generateRefreshToken(
        payload.id,
        payload.email,
        refreshToken
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('Refresh token expired');
        throw new UnauthorizedException(
          'Refresh token expired, please login again'
        );
      }
      this.logger.warn('Invalid refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async resetPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`
      );
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email },
      {
        expiresIn: '15m',
        secret: process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
      }
    );

    // Construct reset link (Frontend route to handle reset)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    await this.mailService.sendMail(
      email,
      'Reset Your Password',
      `
  <div style="font-family: Arial, sans-serif; background-color: #f0f0f0; padding: 50px 0;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #e0e0e0;">
      <h2 style="text-align: center; color: #333333;">Forgot Your Password?</h2>
      <p style="text-align: center; color: #555555; font-size: 16px; line-height: 1.5;">
        No worries! Click the button below to reset your password. If you didn’t request this, you can safely ignore this email.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #007BFF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
           Reset Password
        </a>
      </div>

      <p style="text-align: center; color: #999999; font-size: 14px; line-height: 1.4;">
        If the button doesn’t work, paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #007BFF; word-break: break-all;">${resetLink}</a>
      </p>

      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

      <p style="text-align: center; color: #cccccc; font-size: 12px;">
        © 2025 Your Company. All rights reserved.
      </p>
    </div>
  </div>
  `
    );

    return { message: 'If this email exists, a reset link has been sent.' };
  }

  async resetPasswordConfirm(resetToken: string, newPassword: string) {
    try {
      // 1. Verify token
      const payload = await this.verifyToken(
        resetToken,
        process.env.JWT_RESET_SECRET || process.env.JWT_SECRET
      );

      // 2. Find user
      const user = await this.prisma.user.findUnique({
        where: { id: Number(payload.id) }, // payload.sub = userId
      });

      if (!user) {
        throw new BadRequestException('Invalid token or user not found');
      }

      // 3. Hash the new password
      const hashedPassword = await this.hashPassword(newPassword);

      // 4. Update user’s password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      this.logger.error(
        `Error resetting password: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
