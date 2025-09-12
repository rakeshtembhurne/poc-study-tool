import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from '@/card/card.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

describe('CardService', () => {
  let service: CardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: PrismaService,
          useValue: {
            card: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCard', () => {
    it('should create a card', async () => {
      const dto = {
        frontContent: 'Q',
        backContent: 'A',
        deck: 'deck1',
        userId: 1,
      };
      const newCard = { id: 1, ...dto };
      (prisma.card.create as jest.Mock).mockResolvedValue(newCard);

      const result = await service.createCard(dto as any);
      expect(result).toEqual({ message: 'Card created successfully', newCard });
    });
  });

  describe('updateCard', () => {
    it('should update a card if user owns it', async () => {
      const existing = {
        id: 1,
        userId: 1,
        frontContent: 'Q',
        backContent: 'A',
      };
      const updated = { ...existing, frontContent: 'Updated' };

      (prisma.card.findUnique as jest.Mock).mockResolvedValue(existing);
      (prisma.card.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateCard(
        1,
        { frontContent: 'Updated' } as any,
        1
      );
      expect(result.updatedCard.frontContent).toBe('Updated');
    });

    it('should throw UnauthorizedException if user does not own card', async () => {
      const existing = { id: 1, userId: 2 };
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(existing);

      await expect(service.updateCard(1, {} as any, 1)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('deleteById', () => {
    it('should delete a card if user owns it', async () => {
      const existing = { id: 1, userId: 1 };
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(existing);
      (prisma.card.delete as jest.Mock).mockResolvedValue(existing);

      const result = await service.deleteById(1, 1);
      expect(result.message).toContain('deleted successfully');
    });

    it('should throw NotFoundException if card does not exist', async () => {
      (prisma.card.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.deleteById(1, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
