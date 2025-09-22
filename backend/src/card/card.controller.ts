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
  async createCard(
    @Body() createCardDto: CreateCardDto,
    @User('id') userId: number
  ) {
    return this.cardService.createCard(createCardDto, userId);
  }

  @Put(':id')
  async updateCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCardDto: UpdateCardDto,
    @User('id') userId: number
  ) {
    return this.cardService.updateCard(id, updateCardDto, userId);
  }

  @Get()
  async getCardsByUserId(
    @User('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('deckId') deckId?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const deckIdNum = deckId ? parseInt(deckId, 10) : undefined;

    return this.cardService.getCardsByUserId(
      userId,
      pageNum,
      limitNum,
      search,
      deckIdNum
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
