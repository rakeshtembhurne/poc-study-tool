import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './cardDto/createCard.dto';
import { UpdateCardDto } from './cardDto/updateCard.dto';

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  async createCard(data: CreateCardDto) {
    const newCard = await this.prisma.card.create({ data });
    return {
      message: 'Card created successfully',
      newCard,
    };
  }

  async updateCard(id: number, data: UpdateCardDto) {
    const existingCard = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!existingCard) {
      throw new NotFoundException(`Card with id ${id} not found`);
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

  async getByDeckName(deckName: string) {
    const cards = await this.prisma.card.findMany({
      where: {
        deck: deckName,
      },
    });

    if (!cards || cards.length === 0) {
      throw new NotFoundException(`No cards found for deck "${deckName}"`);
    }

    return cards;
  }

  async deleteById(id: number) {
    const card = await this.prisma.card.findUnique({ where: { id } });

    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }
    await this.prisma.card.delete({ where: { id } });
    return { message: `Card with id ${id} deleted successfully` };
  }

  async deleteAll() {
    const count = await this.prisma.card.count();

    if (count === 0) {
      return { message: 'Table is already empty' };
    }
    const result = await this.prisma.card.deleteMany({});
    return {
      message: 'All cards deleted successfully',
      deletedCount: result.count,
    };
  }
}
