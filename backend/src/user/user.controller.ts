import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { UpdateUserDto } from '@/user/dto/update-user.dto';

@Controller('users')
// @UseGuards(JwtAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    this.logger.log(`User created via controller: ${user.email}`);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    this.logger.log(`Fetched all users via controller`);
    return {
      statusCode: HttpStatus.OK,
      message: 'Users fetched successfully',
      data: users,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(+id);
    this.logger.log(`Fetched user via controller: ${user.email}`);
    return {
      statusCode: HttpStatus.OK,
      message: 'User fetched successfully',
      data: user,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.userService.update(+id, dto);
    this.logger.log(`Updated user via controller: ${updated.email}`);
    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deletedUser = await this.userService.remove(+id);
    this.logger.log(`Deleted user via controller: ${deletedUser.email}`);
    return {
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully',
      data: deletedUser,
    };
  }
}
