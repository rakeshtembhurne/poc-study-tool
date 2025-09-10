import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
    const hashedPassword = await this.authService.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashedPassword },
    });

    this.logger.log(`User created: ${user.email} (ID: ${user.id})`);
    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    this.logger.log(`Fetched all users, count: ${users.length}`);
    return users;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.logger.warn(`User not found: ID ${id}`);
      throw new NotFoundException('User not found');
    }
    this.logger.log(`Fetched user: ${user.email} (ID: ${user.id})`);
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.logger.warn(`Cannot update non-existent user: ID ${id}`);
      throw new NotFoundException('User not found');
    }

    if (dto.password) {
      dto.password = await this.authService.hashPassword(dto.password);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dto,
    });

    this.logger.log(
      `Updated user: ${updatedUser.email} (ID: ${updatedUser.id})`
    );
    return updatedUser;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.logger.warn(`Cannot delete non-existent user: ID ${id}`);
      throw new NotFoundException('User not found');
    }

    const deletedUser = await this.prisma.user.delete({ where: { id } });
    this.logger.log(
      `Deleted user: ${deletedUser.email} (ID: ${deletedUser.id})`
    );
    return deletedUser;
  }
}
