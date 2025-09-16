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

  async createCard(data: CreateCardDto) {
    try {
      const newCard = await this.prisma.card.create({ data });
      return {
        message: 'Card created successfully',
        newCard,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Failed to create card',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  // async updateCard(id: number, data: UpdateCardDto, userId: number) {
  //   try {
  //     const card = await this.prisma.card.findUnique({ where: { id } });
  //     if (!card) {
  //       throw new NotFoundException(`Card with id ${id} not found`);
  //     }
  //     if (Number(card.userId) !== Number(userId)) {
  //       throw new UnauthorizedException(`You cannot update this card`);
  //     }
  //     const updatedCard = await this.prisma.card.update({
  //       where: { id },
  //       data,
  //     });
  //     return {
  //       message: `Card with id ${id} updated successfully`,
  //       updatedCard,
  //     };
  //   } catch (error) {
  //     throw new InternalServerErrorException({
  //       message: `Failed to update card with id ${id}`,
  //       error: error instanceof Error ? error.message : String(error),
  //       stack: error instanceof Error ? error.stack : undefined,
  //     });
  //   }
  // }

  // inside your updateCard
  async updateCard(id: number, data: UpdateCardDto, userId: number) {
    const card = await this.prisma.card.findUnique({ where: { id } });
    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    // console.log(card.userId)
    // console.log(userId)

    if (Number(card.userId) !== Number(userId)) {
      throw new UnauthorizedException(`You cannot update this card`);
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

  async getByDeckName(
    deckName: string,
    userId: number,
    page: number,
    limit: number,
    search?: string
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: Prisma.CardWhereInput = {
        deck: deckName,
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
        throw new NotFoundException(`No cards found for deck "${deckName}"`);
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
      throw new InternalServerErrorException({
        message: `Failed to fetch cards for deck "${deckName}"`,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async deleteById(id: number, userId: number) {
    try {
      const card = await this.prisma.card.findUnique({ where: { id } });
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
}
