import { IsArray, IsOptional, IsString } from 'class-validator';

export class UploadMultipleFilesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  descriptions?: string[];
}
