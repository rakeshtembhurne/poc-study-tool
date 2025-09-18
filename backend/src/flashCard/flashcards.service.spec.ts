import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardsService } from './flashcards.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('FlashcardsService', () => {
  let service: FlashcardsService;
  let prisma: PrismaService;

  const mockDeck = { id: 1, userId: 10, isPublic: false, title: 'My Deck' };
  const mockCards = [
    { id: 1, deckId: 1, question: 'Q1', answer: 'A1' },
    { id: 2, deckId: 1, question: 'Q2', answer: 'A2' },
  ];

  const prismaMock = {
    deck: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      if (Array.isArray(callback)) {
        return await Promise.all(callback.map(async (p) => await p));
      }
      return await callback(prisma);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlashcardsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<FlashcardsService>(FlashcardsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return cards when user owns deck', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(mockDeck);
      prismaMock.deck.findFirst.mockResolvedValue(mockDeck);
      prismaMock.card.findMany.mockResolvedValue(mockCards);
      prismaMock.card.count.mockResolvedValue(mockCards.length);

      const result = await service.findAll({
        deckId: 1,
        page: 1,
        limit: 10,
        requestingUserId: 10,
      });

      expect(result.flashCards).toHaveLength(2);
      expect(prismaMock.deck.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 10 },
      });
    });

    it('should allow access if deck is public even if user is not owner', async () => {
      prismaMock.deck.findUnique.mockResolvedValue({
        ...mockDeck,
        isPublic: true,
        userId: 999,
      });
      prismaMock.deck.findFirst.mockResolvedValue({
        ...mockDeck,
        isPublic: true,
        userId: 999,
      });
      prismaMock.card.findMany.mockResolvedValue(mockCards);
      prismaMock.card.count.mockResolvedValue(mockCards.length);

      const result = await service.findAll({
        deckId: 1,
        requestingUserId: 10,
      });

      expect(result.flashCards).toHaveLength(2);
    });

    it('should throw NotFoundException if deck is private and not owner', async () => {
      prismaMock.deck.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll({ deckId: 1, requestingUserId: 10 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if deck not found', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(null);
      prismaMock.deck.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll({ deckId: 1, requestingUserId: 10 })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBulk', () => {
    it('should create flashcards when user owns deck', async () => {
      prismaMock.deck.findUnique.mockResolvedValue(mockDeck);
      prismaMock.card.create.mockResolvedValue({
        id: 1,
        deckId: 1,
        question: 'Q1',
        answer: 'A1',
      });

      const dto = {
        deckId: 1,
        flashcards: [
          { question: 'Q1', answer: 'A1' },
          { question: 'Q2', answer: 'A2' },
        ],
      };

      const result = await service.createBulk(dto.deckId, 10, dto.flashcards);

      expect(result).toBeDefined();
      expect(prismaMock.card.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.card.create).toHaveBeenCalledWith({
        data: {
          userId: 10,
          deckId: 1,
          frontContent: 'Q1',
          backContent: 'A1',
          reviewHistory: JSON.stringify([]),
        },
      });
    });

    it('should throw ForbiddenException when user does not own deck', async () => {
      prismaMock.deck.findUnique.mockResolvedValue({
        ...mockDeck,
        userId: 999,
      });

      await expect(
        service.createBulk(1, 10, [{ question: 'Q1', answer: 'A1' }])
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
