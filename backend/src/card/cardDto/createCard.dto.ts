// createCard.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreateCardDto {
  @IsInt()
  @IsNotEmpty()
  userId!: number;

  @IsString()
  @IsNotEmpty()
  frontContent!: string;

  @IsString()
  @IsNotEmpty()
  backContent!: string;

  // @IsString()
  // @IsNotEmpty({ message: 'deck cannot be empty' }) // 🔹 fixed message
  // deck!: string; // required when creating

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
