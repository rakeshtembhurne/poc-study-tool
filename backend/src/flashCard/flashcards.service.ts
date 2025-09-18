import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FlashcardsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBulk(
    deckId: number,
    userId: number,
    flashcards: { question: string; answer: string; tags?: string[] }[]
  ) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      throw new NotFoundException(`Deck with ID ${deckId} not found`);
    }

    if (deck.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add cards to this deck'
      );
    }

    const createdCards = await this.prisma.$transaction(
      flashcards.map((fc) =>
        this.prisma.card.create({
          data: {
            userId,
            deckId,
            frontContent: fc.question,
            backContent: fc.answer,
            reviewHistory: JSON.stringify([]),
          },
        })
      )
    );

    return createdCards;
  }
  async findAll({
    page = 1,
    limit = 10,
    deckId,
    sortBy,
    sortOrder,
    search,
    requestingUserId,
  }: {
    page?: number;
    limit?: number;
    deckId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    requestingUserId: number;
  }) {
    page = Math.max(Number(page) || 1, 1);
    limit = Math.max(Number(limit) || 10, 1);
    const skip = (page - 1) * limit;

    const whereClause: Prisma.CardWhereInput = {
      userId: requestingUserId,
    };

    if (deckId) {
      // Optional: Validate deck existence and ownership
      const deckExists = await this.prisma.deck.findFirst({
        where: { id: deckId, userId: requestingUserId },
      });

      if (!deckExists) {
        throw new NotFoundException(`Deck with ID ${deckId} not found`);
      }

      whereClause.deckId = deckId;
    }

    if (search) {
      whereClause.OR = [
        { frontContent: { contains: search, mode: 'insensitive' } },
        { backContent: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: (keyof Prisma.CardOrderByWithRelationInput)[] = [
      'createdAt',
      'nextReviewDate',
      'repetitionCount',
      'aFactor',
    ];

    let orderBy: Prisma.CardOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy && allowedSortFields.includes(sortBy as any)) {
      orderBy = { [sortBy]: sortOrder || 'desc' };
    }

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          deck: { select: { id: true, title: true } },
        },
      }),
      this.prisma.card.count({ where: whereClause }),
    ]);

    return {
      flashCards: cards,
      Count: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
