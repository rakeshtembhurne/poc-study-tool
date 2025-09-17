import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '@/auth/decorators/user.decorator';
import { AuthPayload } from '@/auth/types/auth.types';

import { CreateFlashcardsBulkDto } from './dto/create-flashcards-bulk.dto';

@Controller('flashcards')
@UseGuards(JwtAuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post('bulk')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createBulk(
    @Body() dto: CreateFlashcardsBulkDto,
    @User() user: AuthPayload
  ) {
    const result = await this.flashcardsService.createBulk(
      dto.deckId,
      parseInt(user.id),
      dto.flashcards
    );

    return {
      success: true,
      statusCode: 201,
      message: `Successfully created ${result.length} flashcards`,
      data: {
        data: result,
        Count: { total: result.length },
      },
    };
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  findAll(
    @User() user: AuthPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('deckId') deckId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('search') search?: string
  ) {
    return this.flashcardsService.findAll({
      page: page && page.trim() !== '' ? Number(page) : undefined,
      limit: limit && limit.trim() !== '' ? Number(limit) : undefined,
      deckId: deckId && deckId.trim() !== '' ? Number(deckId) : undefined,
      sortBy: sortBy && sortBy.trim() !== '' ? sortBy : undefined,
      sortOrder:
        sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
      search: search && search.trim() !== '' ? search : undefined,
      requestingUserId: parseInt(user.id),
    });
  }
}
