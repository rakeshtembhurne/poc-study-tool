import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from '@/deck/dto/create.dto';
import { UpdateDeckDto } from '@/deck/dto/update-deck.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeckDto: CreateDeckDto) {
    return this.prisma.deck.create({ data: createDeckDto });
  }

  async findAll({
    page = 1,
    limit = 10,
    publicOnly = false,
    userId,
    sortBy,
    sortOrder,
    search,
  }: {
    page?: number;
    limit?: number;
    publicOnly?: boolean;
    userId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) {
    page = Math.max(Number(page) || 1, 1);
    limit = Math.max(Number(limit) || 10, 1);
    const skip = (page - 1) * limit;

    const whereClause: Prisma.DeckWhereInput = {};
    if (publicOnly) whereClause.isPublic = true;
    if (userId) whereClause.userId = userId;
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
          userId,
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
          search: search || null,
        },
      },
    };
  }

  async findOne(id: number) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });
    if (!deck) throw new NotFoundException(`Deck with ID ${id} not found`);
    return deck;
  }

  async update(id: number, updateDeckDto: UpdateDeckDto) {
    try {
      const existingDeck = await this.prisma.deck.findUnique({ where: { id } });
      if (!existingDeck)
        throw new NotFoundException(`Deck with ID ${id} not found`);

      return this.prisma.deck.update({
        where: { id },
        data: updateDeckDto,
      });
    } catch (error) {
      console.log('-------------------------------->', error);
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const existingDeck = await this.prisma.deck.findUnique({ where: { id } });
      if (!existingDeck) {
        throw new NotFoundException(`Deck with ID ${id} not found`);
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
