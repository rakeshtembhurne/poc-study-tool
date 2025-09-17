import { CreateDeckDto } from '@/deck/dto/create.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateDeckDto extends PartialType(CreateDeckDto) {}
