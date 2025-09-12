import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from '@/card/cardDto/createCard.dto';
import { UpdateCardDto } from '@/card/cardDto/updateCard.dto';

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
    } catch (error: any) {
      throw new InternalServerErrorException('Failed to create card', error);
    }
  }

  async updateCard(id: number, data: UpdateCardDto, userId: number) {
    const card = await this.prisma.card.findUnique({ where: { id } });
    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }
    if (Number(card.userId) !== Number(userId)) {
      throw new UnauthorizedException(`You cannot update this card`);
    }
    const updatedCard = await this.prisma.card.update({
      where: { id },
      data,
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
    const skip = (page - 1) * limit;
    const where: any = {
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
      throw new InternalServerErrorException(
        `Failed to delete card with id ${id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  // async deleteAll() {
  //   try {
  //     const count = await this.prisma.card.count();
  //     if (count === 0) {
  //       return { message: 'Table is already empty' };
  //     }
  //     const result = await this.prisma.card.deleteMany({});
  //     return {
  //       message: 'All cards deleted successfully',
  //       deletedCount: result.count,
  //     };
  //   } catch (error) {
  //     throw new InternalServerErrorException('Failed to delete all cards');
  //   }
  // }
}
