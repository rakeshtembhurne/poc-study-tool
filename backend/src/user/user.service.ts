import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private authService: AuthService, // inject AuthService
  ) { }

  async create(dto: CreateUserDto) {
    // hash the password before saving
    const hashedPassword = await this.authService.hashPassword(dto.password);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    let updateData = { ...dto }; if (dto.password) {
      updateData.password = await this.authService.hashPassword(dto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
