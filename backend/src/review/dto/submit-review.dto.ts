import { IsInt, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitReviewDto {
  @ApiProperty({ description: 'ID of the card being reviewed' })
  @IsInt()
  cardId: number;

  @ApiProperty({
    description: 'Grade from 1-5 (1=Failed, 2=Hard, 3=Good, 4=Easy, 5=Perfect)',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  grade: number;

  @ApiProperty({
    description: 'Response time in milliseconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  responseTimeMs?: number;

  @ApiProperty({
    description: 'When the review was completed',
    required: false,
  })
  @IsOptional()
  reviewedAt?: Date;
}
