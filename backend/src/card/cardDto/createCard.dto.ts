import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';

export class CreateCardDto {
  @IsInt()
  @IsNotEmpty()
  userId!: number; // ✅ notice the !

  @IsString()
  @IsNotEmpty()
  frontContent!: string;

  @IsString()
  @IsNotEmpty()
  backContent!: string;

  @IsOptional()
  @IsString()
  deck?: string;

  @IsInt()
  @IsOptional()
  deckId?: number;

  // Optional advanced fields if you want to allow setting them
  @IsOptional()
  a_factor?: number;

  @IsOptional()
  repetition_count?: number;

  @IsOptional()
  interval_days?: number;

  @IsOptional()
  lapses_count?: number;

  @IsOptional()
  source_type?: string;
}
