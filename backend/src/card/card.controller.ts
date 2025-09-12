import {
  Controller,
  Get,
  Param,
  Delete,
  Body,
  Put,
  ParseIntPipe,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './cardDto/createCard.dto';
import { UpdateCardDto } from '@/card/cardDto/updateCard.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthService } from '@/auth/auth.service';
import { User } from '@/core/common/decorators/user.decorator';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardController {
  constructor(
    private readonly cardService: CardService,
    private readonly authService: AuthService
  ) {}

  @Post()
  async createCard(@Body() createCardDto: CreateCardDto) {
    return this.cardService.createCard(createCardDto);
  }

  @Put(':id')
  async updateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCardDto: UpdateCardDto,
    @User('id') userId: number
  ) {
    return this.cardService.updateCard(id, updateCardDto, userId);
  }

  @Get(':deckName')
  async getByDeckName(
    @Param('deckName') deckName: string,
    @User('id') userId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string
  ) {
    return this.cardService.getByDeckName(
      deckName,
      Number(userId),
      page,
      limit,
      search
    );
  }

  @Delete(':id')
  async deleteCardById(
    @Param('id', ParseIntPipe) id: number,
    @User('id') userId: number
  ) {
    return this.cardService.deleteById(id, userId);
  }
}
