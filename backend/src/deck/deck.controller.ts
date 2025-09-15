import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { DecksService } from '@/deck/deck.service';
import { CreateDeckDto } from '@/deck/dto/create.dto';
import { UpdateDeckDto } from '@/deck/dto/update-deck.dto';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
@Controller('decks')
@UseGuards(JwtAuthGuard)
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Post()
  create(@Body() createDeckDto: CreateDeckDto) {
    return this.decksService.create(createDeckDto);
  }

  @Get()
  findAll() {
    return this.decksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.decksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDeckDto: UpdateDeckDto
  ) {
    return this.decksService.update(id, updateDeckDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.decksService.remove(id);
  }
}
