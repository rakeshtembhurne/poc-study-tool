import { Test, TestingModule } from '@nestjs/testing';
import { DecksService } from '../deck.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

const prismaMock = {
  deck: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  card: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation(async (callback) => {
    if (Array.isArray(callback)) {
      return await Promise.all(callback.map(async (p) => await p));
    }
    return await callback(prismaMock);
  }),
};

describe('DecksService', () => {
  let service: DecksService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecksService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DecksService>(DecksService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDeckDto = {
      title: 'Test Deck',
      description: 'Test Description',
      userId: 1,
    };

    it('should create a deck', async () => {
      const expectedDeck = { id: 1, ...createDeckDto, isPublic: false };
      prismaMock.deck.create.mockResolvedValue(expectedDeck);

      const result = await service.create(createDeckDto);
      expect(result).toEqual(expectedDeck);
      expect(prismaMock.deck.create).toHaveBeenCalledWith({
        data: createDeckDto,
      });
    });

    it('should throw ConflictException if deck title already exists for the user', async () => {
      prismaMock.deck.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Error', {
          code: 'P2002',
          clientVersion: 'mock',
        })
      );

      await expect(service.create(createDeckDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated decks', async () => {
      const decks = [{ id: 1, title: 'Test Deck', userId: 1 }];
      prismaMock.deck.findMany.mockResolvedValue(decks);
      prismaMock.deck.count.mockResolvedValue(1);

      const result = await service.findAll({ userId: 1 });

      expect(result.deck).toEqual(decks);
      expect(result.count.total).toBe(1);
    });
  });

  describe('findOne', () => {
    const deck = { id: 1, title: 'Test Deck', userId: 1, isPublic: false };

    it('should return a deck if found and user has access', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(deck);
      const result = await service.findOne(1, 1);
      expect(result).toEqual(deck);
    });

    it('should throw NotFoundException if deck not found', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user tries to access private deck of another user', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(deck);
      await expect(service.findOne(1, 2)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    const updateDeckDto = { title: 'Updated Deck' };
    const existingDeck = {
      id: 1,
      title: 'Test Deck',
      userId: 1,
      isPublic: false,
    };

    it('should update a deck', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(existingDeck);
      prismaMock.deck.update.mockResolvedValue({
        ...existingDeck,
        ...updateDeckDto,
      });

      const result = await service.update(1, updateDeckDto, 1);
      expect(result.title).toBe('Updated Deck');
    });

    it('should throw NotFoundException if deck to update is not found', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(null);
      await expect(service.update(1, updateDeckDto, 1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw ForbiddenException if user tries to update another user's deck", async () => {
      prismaMock.deck.findUnique.mockResolvedValue(existingDeck);
      await expect(service.update(1, updateDeckDto, 2)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('remove', () => {
    const existingDeck = {
      id: 1,
      title: 'Test Deck',
      userId: 1,
      isPublic: false,
    };

    it('should remove a deck and its cards', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(existingDeck);
      prismaMock.card.deleteMany.mockResolvedValue({ count: 5 });
      prismaMock.deck.delete.mockResolvedValue(existingDeck);

      const result = await service.remove(1, 1);

      expect(result.message).toBe('Deck with ID 1 deleted successfully'); // ✅ UPDATED
      expect(prismaMock.card.deleteMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
      });
      expect(prismaMock.deck.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if deck to remove is not found', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(null);
      await expect(service.remove(1, 1)).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user tries to remove another user's deck", async () => {
      prismaMock.deck.findUnique.mockResolvedValue(existingDeck);
      await expect(service.remove(1, 2)).rejects.toThrow(ForbiddenException);
    });
  });
});
