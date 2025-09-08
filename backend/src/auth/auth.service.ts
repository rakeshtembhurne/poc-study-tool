import { Injectable, UnauthorizedException,BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';



@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
   try {
  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      password: hashedPassword,
    },
  });
  return { message: 'User registered successfully', userId: user.id };
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

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
    message: 'Login successful',  
    userId: user.id,              
    email: user.email,          
    accessToken: token,
  };
}
}
