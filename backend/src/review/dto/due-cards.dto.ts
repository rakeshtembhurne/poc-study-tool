import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DueCardsQueryDto {
  @ApiProperty({
    description: 'Maximum number of cards to return',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ description: 'Filter by specific deck ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  deckId?: number;
}

export class DueCardsResponseDto {
  @ApiProperty({ description: 'List of cards due for review' })
  cards: DueCardDto[];

  @ApiProperty({ description: 'Total number of due cards' })
  totalDue: number;

  @ApiProperty({ description: 'Whether there are more cards beyond the limit' })
  hasMore: boolean;

  @ApiProperty({ description: 'Algorithm used for scheduling' })
  algorithm: string;
}

export class DueCardDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  frontContent: string;

  @ApiProperty()
  backContent: string;

  @ApiProperty()
  aFactor: number;

  @ApiProperty()
  repetitionCount: number;

  @ApiProperty()
  intervalDays: number;

  @ApiProperty()
  nextReviewDate: Date;

  @ApiProperty()
  isOverdue: boolean;

  @ApiProperty()
  overdueHours: number;

  @ApiProperty()
  deck: {
    title: string;
  };
}
