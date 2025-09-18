import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FlashcardDto {
  @IsString()
  @IsNotEmpty({ message: 'question is required' })
  question: string;

  @IsString()
  @IsNotEmpty({ message: 'answer is required' })
  answer: string;

  @IsArray()
  @Type(() => String)
  tags?: string[] = [];
}

export class CreateFlashcardsBulkDto {
  @IsInt({ message: 'deckId must be an integer' })
  deckId: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'flashcards array must not be empty' })
  @ValidateNested({ each: true })
  @Type(() => FlashcardDto)
  flashcards: FlashcardDto[];
}
