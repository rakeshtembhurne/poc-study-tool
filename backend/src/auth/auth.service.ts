import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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

  async generateToken(userId: string, email: string): Promise<string> {
    try {
      const payload: JwtPayload = { sub: userId, email };
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
}
