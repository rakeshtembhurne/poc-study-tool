import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@/user/user.service';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '@/auth/auth.service';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { UpdateUserDto } from '@/user/dto/update-user.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  // let authService: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    openAiApiKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    sm15Parameters: {},
    preferences: {},
    totalReviews: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReviewDate: null,
    totalStudyTimeMinutes: 0,
    cards: [],
    reviews: [],
    ofMatrixEntries: [],
    statistics: [],
  };

  const mockAuthService = {
    hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
    verifyPassword: jest.fn().mockResolvedValue(true),
    generateToken: jest.fn().mockResolvedValue('mocked-jwt-token'),
    verifyToken: jest
      .fn()
      .mockResolvedValue({ id: 1, email: 'test@example.com' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        PrismaService,
        {
          provide: AuthService,
          useValue: mockAuthService, // <-- provide mock
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    // authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      jest.spyOn(prisma.user, 'create').mockResolvedValueOnce(mockUser);
      const result = await service.create(dto);
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith(dto.password);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll()', () => {
    it('should return an array of users', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValueOnce([mockUser]);
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne()', () => {
    it('should return a user by id', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockUser);
      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update()', () => {
    it('should update a user by id', async () => {
      const updateDto: UpdateUserDto = {
        email: 'updated@example.com',
        openAiApiKey: 'new-key',
      };
      const updatedUser = {
        ...mockUser,
        email: updateDto.email ?? mockUser.email,
        openAiApiKey: updateDto.openAiApiKey ?? mockUser.openAiApiKey,
      };

      jest.spyOn(prisma.user, 'update').mockResolvedValueOnce(updatedUser);

      const result = await service.update(1, updateDto);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove()', () => {
    it('should delete a user by id', async () => {
      jest.spyOn(prisma.user, 'delete').mockResolvedValueOnce(mockUser);
      const result = await service.remove(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updatePassword()', () => {
    it('should update the password successfully', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedNewPassword');
      jest.spyOn(prisma.user, 'update').mockResolvedValueOnce({
        ...mockUser,
        password: 'hashedNewPassword',
      });

      const result = await service.updatePassword(1, updatePasswordDto);

      expect(result.success).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        updatePasswordDto.currentPassword,
        mockUser.password
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updatePasswordDto.newPassword,
        12
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'hashedNewPassword' },
      });
    });

    it('should throw UnauthorizedException for invalid current password', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updatePassword(1, updatePasswordDto)
      ).rejects.toThrow('Old password is incorrect');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        updatePasswordDto.currentPassword,
        mockUser.password
      );
    });

    it('should throw BadRequestException if newPassword and confirmPassword do not match', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'mismatchPassword',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockUser);

      await expect(
        service.updatePassword(1, updatePasswordDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updatePassword(1, updatePasswordDto)
      ).rejects.toThrow('Passwords do not match');
    });

    it('should throw BadRequestException if new password is the same as the current password', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'samePassword',
        newPassword: 'samePassword',
        confirmPassword: 'samePassword',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // ✅ ensure old password check passes

      await expect(
        service.updatePassword(1, updatePasswordDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updatePassword(1, updatePasswordDto)
      ).rejects.toThrow('New password cannot be the same as current password');
    });
    it('should throw NotFoundException if user is not found', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      await expect(
        service.updatePassword(999, updatePasswordDto)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
