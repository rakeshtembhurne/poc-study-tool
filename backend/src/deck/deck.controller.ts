import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
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
  Request,
  Req,
} from '@nestjs/common';

// Create a custom decorator to extract user from request
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

// Interface for the authenticated user
export interface AuthenticatedUser {
  sub: string; // user ID from JWT
  email: string;
  iat: number;
  exp: number;
}

@Controller('decks')
@UseGuards(JwtAuthGuard)
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Post()
  create(
    @Body() createDeckDto: CreateDeckDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    // Ensure the deck is created for the authenticated user
    const deckData = {
      ...createDeckDto,
      userId: parseInt(user.sub), // Set userId from authenticated user
    };
    return this.decksService.create(deckData);
  }

  @Get('By/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const deck = await this.decksService.findOne(id, parseInt(user.sub));

    return {
      success: true,
      statusCode: 200,
      message: 'Request successful',
      data: {
        data: deck,
        meta: { total: 1 },
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    };
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('publicOnly') publicOnly?: string,
    @Query('userId') userId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('search') search?: string
  ) {
    // If userId is not provided in query, use the authenticated user's ID
    // If userId IS provided, you might want to check if the user has permission to view other users' decks
    const targetUserId =
      userId && userId.trim() !== '' ? Number(userId) : parseInt(user.sub);

    return this.decksService.findAll({
      page: page && page.trim() !== '' ? Number(page) : undefined,
      limit: limit && limit.trim() !== '' ? Number(limit) : undefined,
      publicOnly: publicOnly === 'true',
      userId: targetUserId,
      sortBy: sortBy && sortBy.trim() !== '' ? sortBy : undefined,
      sortOrder:
        sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined,
      search: search && search.trim() !== '' ? search : undefined,
      requestingUserId: parseInt(user.sub), // Pass the requesting user's ID for authorization checks
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeckDto: UpdateDeckDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.decksService.update(id, updateDeckDto, parseInt(user.sub));
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.decksService.remove(id, parseInt(user.sub));
  }
}
