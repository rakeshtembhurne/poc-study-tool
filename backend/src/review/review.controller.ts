import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthPayload } from '../auth/types/auth.types';
import {
  ApiSuccessResponse,
  ApiCommonResponses,
} from '../core/common/decorators/api-response.decorator';
import { ReviewService } from './review.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { DueCardsQueryDto, DueCardsResponseDto } from './dto/due-cards.dto';
import { ReviewResultDto, BasicStatsDto } from './dto/review-result.dto';

@ApiTags('Review')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiCommonResponses()
@Controller('review')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get('due')
  @ApiOperation({
    summary: 'Get due cards for review using SM-15 algorithm',
    description:
      'Retrieves cards that are due for review based on the SM-15 spaced repetition algorithm. Cards are sorted by due date and difficulty.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of cards to return (default: 20, max: 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'deckId',
    required: false,
    type: Number,
    description: 'Filter cards by specific deck ID',
    example: 1,
  })
  @ApiSuccessResponse(200, {
    type: DueCardsResponseDto,
    description: 'Successfully retrieved due cards',
  })
  async getDueCards(
    @Request() req: { user: AuthPayload },
    @Query() query: DueCardsQueryDto
  ): Promise<DueCardsResponseDto> {
    // Validate limit parameter
    if (query.limit && (query.limit < 1 || query.limit > 10000)) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    const userId = parseInt(req.user.id);
    return await this.reviewService.getDueCards(userId, query);
  }

  @Post('submit')
  @ApiOperation({
    summary: 'Submit card review and trigger SM-15 algorithm',
    description:
      'Processes a card review using the SM-15 spaced repetition algorithm. Updates A-Factor, calculates next interval, and adjusts OF/Recall matrices.',
  })
  @ApiSuccessResponse(201, {
    type: ReviewResultDto,
    description: 'Review processed successfully with SM-15 algorithm results',
  })
  async submitReview(
    @Request() req: { user: AuthPayload },
    @Body() reviewData: SubmitReviewDto
  ): Promise<ReviewResultDto> {
    // Validate grade range
    if (reviewData.grade < 0 || reviewData.grade > 5) {
      throw new BadRequestException(
        'Grade must be between 0 (complete blackout) and 5 (perfect recall)'
      );
    }

    // Validate response time if provided
    if (reviewData.responseTimeMs && reviewData.responseTimeMs < 0) {
      throw new BadRequestException('Response time must be a positive number');
    }

    const userId = parseInt(req.user.id);
    return await this.reviewService.submitReview(userId, reviewData);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get review statistics and SM-15 metrics',
    description:
      'Returns comprehensive statistics including total reviews, learning progress, retention rates, and SM-15 algorithm performance metrics.',
  })
  @ApiSuccessResponse(200, {
    type: BasicStatsDto,
    description: 'User review statistics and algorithm metrics',
  })
  async getBasicStats(
    @Request() req: { user: AuthPayload }
  ): Promise<BasicStatsDto> {
    const userId = parseInt(req.user.id);
    return await this.reviewService.getBasicStats(userId);
  }

  @Get('history/:cardId')
  @ApiOperation({
    summary: 'Get card review history',
    description:
      'Returns the complete review history for a specific card, including grades, intervals, and A-Factor changes.',
  })
  @ApiSuccessResponse(200, {
    type: Array,
    description: 'Card review history with SM-15 algorithm data',
  })
  async getCardHistory(
    @Request() req: { user: AuthPayload },
    @Param('cardId', ParseIntPipe) cardId: number
  ): Promise<any[]> {
    if (cardId < 1) {
      throw new BadRequestException('Card ID must be a positive number');
    }

    const userId = parseInt(req.user.id);
    const history = await this.reviewService.getCardHistory(userId, cardId);

    if (history.length === 0) {
      throw new NotFoundException(`No review history found for card ${cardId}`);
    }

    return history;
  }
}
