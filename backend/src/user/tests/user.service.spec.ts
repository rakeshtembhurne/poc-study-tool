import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service'; // <-- import AuthService
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
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
    verifyToken: jest.fn().mockResolvedValue({ sub: 1, email: 'test@example.com' }),
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
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = { email: 'test@example.com', password: 'password123' };

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
      const updateDto: UpdateUserDto = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, email: updateDto.email ?? mockUser.email };

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
});
