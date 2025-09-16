import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from '@/deck/dto/create.dto';
import { UpdateDeckDto } from '@/deck/dto/update-deck.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createDeckDto: CreateDeckDto & { userId: number }) {
    try {
      return await this.prisma.deck.create({ data: createDeckDto });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `A deck with the title "${createDeckDto.title}" already exists for this user.`
        );
      }
      throw error;
    }
  }
  async findAll({
    page = 1,
    limit = 10,
    publicOnly = false,
    userId,
    sortBy,
    sortOrder,
    search,
    requestingUserId,
  }: {
    page?: number;
    limit?: number;
    publicOnly?: boolean;
    userId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    requestingUserId?: number;
  }) {
    page = Math.max(Number(page) || 1, 1);
    limit = Math.max(Number(limit) || 10, 1);
    const skip = (page - 1) * limit;

    const whereClause: Prisma.DeckWhereInput = {};

    if (userId || !publicOnly) {
      whereClause.userId = userId ?? requestingUserId;
    }

    if (publicOnly || (userId && userId !== requestingUserId)) {
      whereClause.isPublic = true;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allowedSortFields: (keyof Prisma.DeckOrderByWithRelationInput)[] = [
      'title',
      'createdAt',
      'updatedAt',
    ];

    let orderBy: Prisma.DeckOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy && allowedSortFields.includes(sortBy as any)) {
      orderBy = {
        [sortBy]: sortOrder || 'desc',
      } as Prisma.DeckOrderByWithRelationInput;
    }

    const [decks, total] = await Promise.all([
      this.prisma.deck.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.deck.count({ where: whereClause }),
    ]);

    return {
      data: decks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
        appliedFilters: {
          publicOnly,
          userId: userId ?? requestingUserId,
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
          search: search || null,
        },
      },
    };
  }

  async findOne(id: number, requestingUserId: number) {
    const deck = await this.prisma.deck.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException(`Deck with ID ${id} not found`);
    }

    if (deck.userId !== requestingUserId && !deck.isPublic) {
      throw new ForbiddenException(
        'You do not have permission to access this deck'
      );
    }

    return deck;
  }

  async update(
    id: number,
    updateDeckDto: UpdateDeckDto,
    requestingUserId: number
  ) {
    try {
      const existingDeck = await this.prisma.deck.findUnique({ where: { id } });
      if (!existingDeck) {
        throw new NotFoundException(`Deck with ID ${id} not found`);
      }
      if (existingDeck.userId !== requestingUserId) {
        throw new ForbiddenException('You can only update your own decks');
      }

      return this.prisma.deck.update({
        where: { id },
        data: updateDeckDto,
      });
    } catch (error) {
      console.log('-------------------------------->', error);
      throw error;
    }
  }

  async remove(id: number, requestingUserId: number) {
    try {
      const existingDeck = await this.prisma.deck.findUnique({ where: { id } });
      if (!existingDeck) {
        throw new NotFoundException(`Deck with ID ${id} not found`);
      }
      if (existingDeck.userId !== requestingUserId) {
        throw new ForbiddenException('You can only delete your own decks');
      }

      const result = await this.prisma.$transaction([
        this.prisma.card.deleteMany({
          where: { deckId: id },
        }),
        this.prisma.deck.delete({
          where: { id },
        }),
      ]);

      return {
        message: `Deck and its cards deleted successfully`,
        deletedCards: result[0].count,
        deletedDeck: result[1],
      };
    } catch (error) {
      console.error('Error deleting deck and cards:', error);
      throw error;
    }
  }
}
