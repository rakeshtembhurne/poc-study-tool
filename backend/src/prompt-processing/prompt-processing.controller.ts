import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PromptProcessingService } from './prompt-processing.service';
import { PromptInputDto } from './dto/prompt-input.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

@Controller('prompt')
export class PromptProcessingController {
  constructor(private readonly promptService: PromptProcessingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generate(
    @Body() dto: PromptInputDto,
    @Req() req: Request & { user: { id: string } }
  ) {
    const userId = req.user.id;
    return this.promptService.processPrompt(dto, userId);
  }
}
