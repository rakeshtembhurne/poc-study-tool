import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  front_content?: string;

  @IsString()
  @IsOptional()
  back_content?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  deck?: string;

  @IsInt()
  @IsOptional()
  deckId?: number;

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
