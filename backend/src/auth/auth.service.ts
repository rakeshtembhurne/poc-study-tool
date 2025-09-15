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
  async verifyToken(token: string, secret?: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
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
      const payload: JwtPayload = { sub: String(userId), email };
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
        payload.sub,
        payload.email
      );
      const newRefreshToken = await this.generateRefreshToken(
        payload.sub,
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
      { expiresIn: '15m' }
    );
    return { message: 'If this email exists, a reset link has been sent.' };
  }
}
