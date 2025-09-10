import {
  Controller,
  Get,
  Param,
  Delete,
  Body,
  Put,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './cardDto/createCard.dto';
import { UpdateCardDto } from './cardDto/updateCard.dto';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  async createCard(@Body() createCardDto: CreateCardDto) {
    return this.cardService.createCard(createCardDto);
  }

  @Put(':id')
  async updateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCardDto: UpdateCardDto
  ) {
    return this.cardService.updateCard(id, updateCardDto);
  }

  @Get(':deckName')
  async getByDeckName(@Param('deckName') deckName: string) {
    return this.cardService.getByDeckName(deckName);
  }

  @Delete(':id')
  getUserById(@Param('id') id: string) {
    return this.cardService.deleteById(Number(id));
  }

  @Delete()
  deleteAllCards() {
    return this.cardService.deleteAll();
  }
}
