import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            // Add mock methods as needed
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest
              .fn()
              .mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await service.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(typeof hashedPassword).toBe('string');
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await service.hashPassword(password);

      const isValid = await service.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await service.verifyPassword(
        'wrongPassword',
        hashedPassword
      );
      expect(isInvalid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token', async () => {
      const userId = 'test-user-id';
      const email = 'test@example.com';

      const token = await service.generateToken(userId, email);
      expect(token).toBe('test-token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: userId, email });
    });
  });

  describe('verifyToken', () => {
    it('should verify JWT token', async () => {
      const token = 'test-token';
      const payload = await service.verifyToken(token);

      expect(payload).toEqual({ sub: 'user-id', email: 'test@example.com' });
      expect(jwtService.verify).toHaveBeenCalledWith(token);
    });
  });
});
