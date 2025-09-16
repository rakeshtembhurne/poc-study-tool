import { PartialType } from '@nestjs/swagger';
import { UploadFileDto } from './create-file-processing.dto';

export class UpdateFileProcessingDto extends PartialType(UploadFileDto) {}
