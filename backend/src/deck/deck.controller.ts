import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { User } from '@/auth/decorators/user.decorator';
import { AuthPayload } from '@/auth/types/auth.types';
import { DecksService } from '@/deck/deck.service';
import { CreateDeckDto } from '@/deck/dto/create.dto';
import { UpdateDeckDto } from '@/deck/dto/update-deck.dto';

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
  Query,
} from '@nestjs/common';

@Controller('decks')
@UseGuards(JwtAuthGuard)
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Post()
  create(@Body() createDeckDto: CreateDeckDto, @User() user: AuthPayload) {
    // Ensure the deck is created for the authenticated user
    const deckData = {
      ...createDeckDto,
      userId: parseInt(user.id), // Set userId from authenticated user
    };
    return this.decksService.create(deckData);
  }

  @Get('By/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthPayload
  ) {
    const deck = await this.decksService.findOne(id, parseInt(user.id));

    return {
      ...deck,
      meta: { total: 1 },
    };
  }

  @Get()
  findAll(
    @User() user: AuthPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('publicOnly') publicOnly?: string,
    @Query('userId') userId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('search') search?: string
  ) {
    const targetUserId =
      userId && userId.trim() !== '' ? Number(userId) : parseInt(user.id);

    return this.decksService.findAll({
      page: page && page.trim() !== '' ? Number(page) : undefined,
      limit: limit && limit.trim() !== '' ? Number(limit) : undefined,
      publicOnly: publicOnly === 'true',
      userId: targetUserId,
      sortBy: sortBy && sortBy.trim() !== '' ? sortBy : undefined,
      sortOrder:
        sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
      search: search && search.trim() !== '' ? search : undefined,
      requestingUserId: parseInt(user.id), // Pass the requesting user's ID for authorization checks
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeckDto: UpdateDeckDto,
    @User() user: AuthPayload
  ) {
    return this.decksService.update(id, updateDeckDto, parseInt(user.id));
  }

  @Delete(':id')
  remove(@User() user: AuthPayload, @Param('id', ParseIntPipe) id: number) {
    return this.decksService.remove(id, parseInt(user.id));
  }
}
