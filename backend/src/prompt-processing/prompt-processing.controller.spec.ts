import { Test, TestingModule } from '@nestjs/testing';
import { PromptProcessingController } from './prompt-processing.controller';
import { PromptProcessingService } from './prompt-processing.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthService } from '@/auth/auth.service';
import { ExecutionContext } from '@nestjs/common';

describe('PromptProcessingController', () => {
  let controller: PromptProcessingController;
  let service: Partial<PromptProcessingService>;

  beforeEach(async () => {
    service = { processPrompt: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromptProcessingController],
      providers: [
        { provide: PromptProcessingService, useValue: service },
        { provide: AuthService, useValue: { validateUser: jest.fn() } }, // mock
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (_context: ExecutionContext) => true, // bypass guard
      })
      .compile();

    controller = module.get<PromptProcessingController>(
      PromptProcessingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
