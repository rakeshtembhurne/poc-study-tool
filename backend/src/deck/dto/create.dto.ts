import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsNotEmpty()
  userId: number;
}
