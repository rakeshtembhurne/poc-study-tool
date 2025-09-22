// createCard.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  frontContent!: string;

  @IsString()
  @IsNotEmpty()
  backContent!: string;

  @IsInt()
  @IsNotEmpty({ message: 'deckId is required' })
  deckId!: number; // ✅ required foreign key

  @IsNumber()
  @IsOptional()
  aFactor?: number; // 🔹 fixed casing

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
}
