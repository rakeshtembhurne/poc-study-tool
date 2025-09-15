import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from '@/deck/dto/create.dto';
import { UpdateDeckDto } from '@/deck/dto/update-deck.dto';

@Injectable()
export class DecksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDeckDto: CreateDeckDto) {
    return this.prisma.deck.create({ data: createDeckDto });
  }

  async findAll() {
    return this.prisma.deck.findMany();
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
