import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { DueCardsQueryDto, DueCardsResponseDto } from './dto/due-cards.dto';
import { ReviewResultDto, BasicStatsDto } from './dto/review-result.dto';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get('due')
  @ApiOperation({
    summary: 'Get due cards for review - supports multiple users',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of cards (default: 20, max: 100)',
  })
  @ApiQuery({
    name: 'deckId',
    required: false,
    type: Number,
    description: 'Filter by deck ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Cards due for review',
    type: DueCardsResponseDto,
  })
  async getDueCards(
    @Request() req: any,
    @Query() query: DueCardsQueryDto
  ): Promise<DueCardsResponseDto> {
    // Each user gets their own due cards automatically
    const userId = req.user?.id || 1; // TODO: Get from JWT auth
    return this.reviewService.getDueCards(userId, query);
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit card review - triggers SM-15 algorithm' })
  @ApiResponse({
    status: 201,
    description: 'Review processed successfully',
    type: ReviewResultDto,
  })
  async submitReview(
    @Request() req: any,
    @Body() reviewData: SubmitReviewDto
  ): Promise<ReviewResultDto> {
    // SM-15 algorithm runs independently for each user
    const userId = req.user?.id || 1; // TODO: Get from JWT auth
    return this.reviewService.submitReview(userId, reviewData);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get basic review statistics' })
  @ApiResponse({
    status: 200,
    description: 'User review statistics',
    type: BasicStatsDto,
  })
  async getBasicStats(@Request() req: any): Promise<BasicStatsDto> {
    const userId = req.user?.id || 1; // TODO: Get from JWT auth
    return this.reviewService.getBasicStats(userId);
  }

  @Get('history/:cardId')
  @ApiOperation({ summary: 'Get card review history' })
  @ApiResponse({ status: 200, description: 'Card review history' })
  async getCardHistory(
    @Request() req: any,
    @Param('cardId', ParseIntPipe) cardId: number
  ): Promise<any[]> {
    const userId = req.user?.id || 1; // TODO: Get from JWT auth
    return this.reviewService.getCardHistory(userId, cardId);
  }
}
