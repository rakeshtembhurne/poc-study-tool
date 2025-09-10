import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '@/auth/auth.service';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { UpdateUserDto } from '@/user/dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {}

  async create(dto: CreateUserDto) {
    try {
      // Check if email already exists
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        this.logger.warn(`Attempted to create duplicate email: ${dto.email}`);
        throw new BadRequestException('Email already exists');
      }

      const hashedPassword = await this.authService.hashPassword(dto.password);
      const user = await this.prisma.user.create({
        data: { ...dto, password: hashedPassword },
        select: { id: true, email: true, createdAt: true, updatedAt: true }, // exclude password
      });

      this.logger.log(`User created: ${user.email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      const e = error as Error;
      this.logger.error(`Failed to create user: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });
      this.logger.log(`Fetched all users, count: ${users.length}`);
      return users;
    } catch (error) {
      const e = error as Error;
      this.logger.error(`Failed to fetch users: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, createdAt: true, updatedAt: true },
      });

      if (!user) {
        this.logger.warn(`User not found: ID ${id}`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Fetched user: ${user.email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      const e = error as Error;
      this.logger.error(`Failed to fetch user ID ${id}: ${e.message}`, e.stack);
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async update(id: number, dto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        this.logger.warn(`Cannot update non-existent user: ID ${id}`);
        throw new NotFoundException('User not found');
      }
      const updateData = { ...dto };
      if (dto.password) {
        updateData.password = await this.authService.hashPassword(dto.password);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, email: true, createdAt: true, updatedAt: true }, // exclude password
      });

      this.logger.log(
        `Updated user: ${updatedUser.email} (ID: ${updatedUser.id})`
      );
      return updatedUser;
    } catch (error) {
      const e = error as Error;
      this.logger.error(
        `Failed to update user ID ${id}: ${e.message}`,
        e.stack
      );
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        this.logger.warn(`Cannot delete non-existent user: ID ${id}`);
        throw new NotFoundException('User not found');
      }

      const deletedUser = await this.prisma.user.delete({
        where: { id },
        select: { id: true, email: true, createdAt: true, updatedAt: true }, // exclude password
      });

      this.logger.log(
        `Deleted user: ${deletedUser.email} (ID: ${deletedUser.id})`
      );
      return deletedUser;
    } catch (error) {
      const e = error as Error;
      this.logger.error(
        `Failed to delete user ID ${id}: ${e.message}`,
        e.stack
      );
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
