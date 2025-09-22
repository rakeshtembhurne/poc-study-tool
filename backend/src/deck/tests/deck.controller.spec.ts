import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DecksController } from '../deck.controller';
import { DecksService } from '../deck.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuthPayload } from '../../auth/types/auth.types';

const decksServiceMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DecksController', () => {
  let controller: DecksController;
  let _service: DecksService;

  const mockUser: AuthPayload = { id: '1', email: 'test@example.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecksController],
      providers: [{ provide: DecksService, useValue: decksServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<DecksController>(DecksController);
    _service = module.get<DecksService>(DecksService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a deck', async () => {
      const createDeckDto = { title: 'Test Deck', description: 'Test Desc' };
      const expectedDeck = { id: 1, ...createDeckDto, userId: 1 };
      decksServiceMock.create.mockResolvedValue(expectedDeck);

      const result = await controller.create(createDeckDto, mockUser);
      expect(result).toEqual(expectedDeck);
      expect(decksServiceMock.create).toHaveBeenCalledWith({
        ...createDeckDto,
        userId: 1,
      });
    });
  });

  describe('findAll', () => {
    it('should find all decks for the user', async () => {
      const expectedResponse = { deck: [], count: {} };
      decksServiceMock.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(mockUser);
      expect(result).toEqual(expectedResponse);
      expect(decksServiceMock.findAll).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        publicOnly: false,
        userId: 1,
        sortBy: undefined,
        sortOrder: undefined,
        search: undefined,
        requestingUserId: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should find a single deck', async () => {
      const deck = { id: 1, title: 'Test Deck', userId: 1 };
      decksServiceMock.findOne.mockResolvedValue(deck);

      const result = await controller.findOne(1, mockUser);

      expect(result).toEqual({
        ...deck,
        meta: { total: 1 }, // ✅ include meta in expectation
      });

      expect(decksServiceMock.findOne).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('update', () => {
    it('should update a deck', async () => {
      const updateDeckDto = { title: 'Updated Deck' };
      const expectedDeck = { id: 1, title: 'Updated Deck', userId: 1 };
      decksServiceMock.update.mockResolvedValue(expectedDeck);

      const result = await controller.update(1, updateDeckDto, mockUser);
      expect(result).toEqual(expectedDeck);
      expect(decksServiceMock.update).toHaveBeenCalledWith(1, updateDeckDto, 1);
    });
  });

  describe('remove', () => {
    it('should remove a deck', async () => {
      const expectedResponse = {
        message: 'Deck with ID 1 deleted successfully',
      }; // ✅ UPDATED
      decksServiceMock.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(mockUser, 1);
      expect(result).toEqual(expectedResponse);
      expect(decksServiceMock.remove).toHaveBeenCalledWith(1, 1);
    });
  });
});
