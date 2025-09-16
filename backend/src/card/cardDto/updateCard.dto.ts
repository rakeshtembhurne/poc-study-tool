import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { ReviewHistoryDto } from './ReviewHistoryDto.dto';
import { Type } from 'class-transformer';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  frontContent?: string;

  @IsString()
  @IsOptional()
  backContent?: string;

  // @IsString()
  // @IsOptional()
  // deck?: string; // optional for updates

  @IsNumber()
  @IsOptional()
  deckId?: number;

  @IsNumber()
  @IsOptional()
  aFactor?: number;

  @IsInt()
  @IsOptional()
  repetitionCount?: number;

  @IsInt()
  @IsOptional()
  intervalDays?: number;

  @IsInt()
  @IsOptional()
  lapsesCount?: number;

  @IsString()
  @IsOptional()
  sourceType?: string;

  @ValidateNested({ each: true })
  @Type(() => ReviewHistoryDto)
  @IsOptional()
  reviewHistory?: ReviewHistoryDto[];

  @IsOptional()
  ofMatrixUpdates?: object;
}
