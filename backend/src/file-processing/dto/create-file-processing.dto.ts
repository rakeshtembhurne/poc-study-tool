import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  description?: string;
}

export class FileResponseDto {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
  description?: string;
}
