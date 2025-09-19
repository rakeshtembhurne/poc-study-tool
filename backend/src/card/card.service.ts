import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from '@/card/cardDto/createCard.dto';
import { UpdateCardDto } from '@/card/cardDto/updateCard.dto';
import { Prisma } from '@prisma/client';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  async createCard(data: CreateCardDto, userId: number) {
    try {
      // Verify that the deck belongs to the user
      const deck = await this.prisma.deck.findUnique({
        where: {
          id: data.deckId,
        },
        select: {
          userId: true,
        },
      });

      if (!deck) {
        throw new NotFoundException(`Deck with id ${data.deckId} not found`);
      }

      if (Number(deck.userId) !== Number(userId)) {
        throw new UnauthorizedException(`You cannot create cards in this deck`);
      }

      // Ensure userId from token is used instead of any provided in data
      const cardData = {
        ...data,
        userId: Number(userId),
      };

      const newCard = await this.prisma.card.create({ data: cardData });
      return {
        message: 'Card created successfully',
        newCard,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Failed to create card',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async updateCard(id: number, data: UpdateCardDto, userId: number) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        deck: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    if (Number(card.userId) !== Number(userId)) {
      throw new UnauthorizedException(`You cannot update this card`);
    }

    // If deckId is being updated, verify that the new deck belongs to the user
    if (data.deckId && data.deckId !== card.deckId) {
      const deck = await this.prisma.deck.findUnique({
        where: {
          id: data.deckId,
        },
        select: {
          userId: true,
        },
      });

      if (!deck) {
        throw new NotFoundException(`Deck with id ${data.deckId} not found`);
      }

      if (Number(deck.userId) !== Number(userId)) {
        throw new UnauthorizedException(`You cannot move cards to this deck`);
      }
    }

    const prismaData: any = {
      ...data,
      reviewHistory: data.reviewHistory
        ? instanceToPlain(data.reviewHistory)
        : [],
    };

    const updatedCard = await this.prisma.card.update({
      where: { id },
      data: prismaData,
    });

    return {
      message: `Card with id ${id} updated successfully`,
      updatedCard,
    };
  }
  async getCardsByUserId(
    userId: number,
    page: number,
    limit: number,
    search?: string,
    deckId?: number
  ) {
    try {
      // Ensure all numeric values are properly converted
      const numericUserId = Number(userId);
      const numericPage = Number(page);
      const numericLimit = Number(limit);
      const numericDeckId = deckId ? Number(deckId) : undefined;

      console.log(
        'Getting cards for userId:',
        numericUserId,
        'page:',
        numericPage,
        'limit:',
        numericLimit,
        'search:',
        search,
        'deckId:',
        numericDeckId
      );

      const skip = (numericPage - 1) * numericLimit;

      const where: Prisma.CardWhereInput = {
        userId: numericUserId,
      };

      // Add optional deck filter and validate deck ownership
      if (numericDeckId) {
        // Verify that the deck belongs to the user
        const deck = await this.prisma.deck.findUnique({
          where: {
            id: numericDeckId,
          },
          select: {
            userId: true,
          },
        });

        if (!deck) {
          throw new NotFoundException(
            `Deck with id ${numericDeckId} not found`
          );
        }

        if (Number(deck.userId) !== numericUserId) {
          throw new UnauthorizedException(
            `You cannot access cards in this deck`
          );
        }

        where.deckId = numericDeckId;
      }

      // Add search functionality
      if (search && search.trim()) {
        where.OR = [
          { frontContent: { contains: search.trim(), mode: 'insensitive' } },
          { backContent: { contains: search.trim(), mode: 'insensitive' } },
        ];
      }

      console.log('Prisma where clause:', JSON.stringify(where, null, 2));

      const [cards, total] = await Promise.all([
        this.prisma.card.findMany({
          where,
          skip,
          take: numericLimit,
          orderBy: { createdAt: 'desc' },
          include: {
            deck: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        }),
        this.prisma.card.count({ where }),
      ]);

      console.log('Found cards count:', cards.length, 'total:', total);

      // Return empty result instead of throwing error when no cards found
      return {
        data: cards,
        meta: {
          total,
          page: numericPage,
          limit: numericLimit,
          totalPages: total > 0 ? Math.ceil(total / numericLimit) : 0,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error('Error in getCardsByUserId:', error);

      throw new InternalServerErrorException({
        message: `Failed to fetch cards for user`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async getByDeckId(
    deckId: number,
    userId: number,
    page: number,
    limit: number,
    search?: string
  ) {
    try {
      // Verify that the deck belongs to the user
      const deck = await this.prisma.deck.findUnique({
        where: {
          id: deckId,
        },
        select: {
          userId: true,
        },
      });

      if (!deck) {
        throw new NotFoundException(`Deck with id ${deckId} not found`);
      }

      if (Number(deck.userId) !== Number(userId)) {
        throw new UnauthorizedException(`You cannot access cards in this deck`);
      }

      const skip = (page - 1) * limit;

      const where: Prisma.CardWhereInput = {
        deckId,
        userId,
      };

      if (search) {
        where.OR = [
          { frontContent: { contains: search, mode: 'insensitive' } },
          { backContent: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [cards, total] = await Promise.all([
        this.prisma.card.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.card.count({ where }),
      ]);

      if (!cards.length) {
        throw new NotFoundException(`No cards found for deck "${deckId}"`);
      }

      return {
        data: cards,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        message: `Failed to fetch cards for deck "${deckId}"`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async deleteById(id: number, userId: number) {
    try {
      const card = await this.prisma.card.findUnique({
        where: { id },
        include: {
          deck: {
            select: {
              userId: true,
            },
          },
        },
      });
      if (!card) {
        throw new NotFoundException(`Card with id ${id} not found`);
      }
      if (Number(card.userId) !== Number(userId)) {
        throw new UnauthorizedException(`You cannot delete this card`);
      }
      await this.prisma.card.delete({ where: { id } });
      return { message: `Card with id ${id} deleted successfully` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: `Failed to delete card with id ${id}`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async getCardById(id: number, userId: number) {
    try {
      const card = await this.prisma.card.findUnique({
        where: { id },
        include: {
          deck: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });

      if (!card) {
        throw new NotFoundException(`Card with id ${id} not found`);
      }

      if (Number(card.userId) !== Number(userId)) {
        throw new UnauthorizedException(`You cannot access this card`);
      }

      return {
        data: card,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: `Failed to fetch card with id ${id}`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
}
