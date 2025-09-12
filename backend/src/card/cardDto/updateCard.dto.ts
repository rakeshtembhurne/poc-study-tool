// import { IsOptional, IsString, IsInt, IsNotEmpty } from 'class-validator';

// export class UpdateCardDto {
//   @IsString()
//   @IsOptional()
//   front_content?: string;

//   @IsString()
//   @IsOptional()
//   back_content?: string;

//   @IsString()
//   @IsNotEmpty({ message: 'deckName cannot be empty' })
//   deck?: string;

//   @IsOptional()
//   a_factor?: number;

//   @IsOptional()
//   repetition_count?: number;

//   @IsOptional()
//   interval_days?: number;

//   @IsOptional()
//   lapses_count?: number;

//   @IsOptional()
//   source_type?: string;
// }

import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  frontContent?: string;

  @IsString()
  @IsOptional()
  backContent?: string;

  @IsString()
  @IsNotEmpty({ message: 'deckName cannot be empty' })
  deck?: string;

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

  @IsOptional()
  reviewHistory?: any[];

  @IsOptional()
  ofMatrixUpdates?: object;
}
