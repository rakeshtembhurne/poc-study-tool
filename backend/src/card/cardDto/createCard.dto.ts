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

  @IsString()
  @IsNotEmpty({ message: 'deckName cannot be empty' })
  deck?: string;

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
