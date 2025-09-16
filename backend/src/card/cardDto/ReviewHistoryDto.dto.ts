import { IsInt, IsDateString, IsString } from 'class-validator';

export class ReviewHistoryDto {
  @IsDateString()
  date!: string;

  @IsInt()
  interval!: number;

  @IsString()
  grade!: string;
}
