import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { Logger, InternalServerErrorException } from '@nestjs/common';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
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
      const refreshToken = await this.generateRefreshToken(user.id);
      const hashedRefreshToken = await this.hashPassword(refreshToken);

      // 3. Save hashed refresh token in DB
      await this.prisma.user.update({
        where: { id: user.id },
        data: { hashedRefreshToken },
      });

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
    const refreshToken = await this.generateRefreshToken(user.id);

    const hashedRefreshToken = await this.hashPassword(refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken },
    });

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
      const salt = await bcrypt.genSalt(10);
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
      throw new InternalServerErrorException('Error verifying password');
    }
  }

  async generateToken(userId: string | number, email: string): Promise<string> {
    try {
      const payload: JwtPayload = { sub: String(userId), email }; // convert to string
      return this.jwtService.sign(payload);
    } catch (error) {
      this.logger.error(
        `Error generating token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new InternalServerErrorException('Error generating token');
    }
  }
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      this.logger.error(
        `Error verifying token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new InternalServerErrorException('Error verifying token');
    }
  }

  async generateRefreshToken(userId: string | number): Promise<string> {
    try {
      const payload: JwtPayload = { sub: String(userId), email: '' };
      return this.jwtService.sign(payload, {
        expiresIn: '7d',
      });
    } catch (error) {
      this.logger.error(
        `Error generating refresh token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new InternalServerErrorException('Error generating refresh token');
    }
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      throw new BadRequestException('Invalid userId');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userIdNum },
    });
    if (!user || !user.hashedRefreshToken)
      throw new UnauthorizedException('Access Denied');

    const isValid = await this.verifyPassword(
      refreshToken,
      user.hashedRefreshToken
    );
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const newAccessToken = await this.generateToken(user.id, user.email);
    const newRefreshToken = await this.generateRefreshToken(user.id);
    const hashedNewRefreshToken = await this.hashPassword(newRefreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { hashedRefreshToken: hashedNewRefreshToken },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async resetPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(
        `Password reset requested for non-existent email: ${email}`
      );
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    // Generate a temporary reset token (JWT or random string)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email },
      { expiresIn: '15m' }
    );

    // Console log instead of sending email
    this.logger.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If this email exists, a reset link has been sent.' };
  }
}
