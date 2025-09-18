import { Test, TestingModule } from '@nestjs/testing';
import { PromptProcessingController } from './prompt-processing.controller';
import { PromptProcessingService } from './prompt-processing.service';

describe('PromptProcessingController', () => {
  let controller: PromptProcessingController;
  let service: Partial<PromptProcessingService>;

  beforeEach(async () => {
    service = { processPrompt: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromptProcessingController],
      providers: [{ provide: PromptProcessingService, useValue: service }],
    }).compile();

    controller = module.get<PromptProcessingController>(
      PromptProcessingController
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service with correct parameters', async () => {
    const dto = { text: 'hi', deckName: 'Deck 1' };
    const mockReq = { user: { id: 'user1' } } as any;
    (service.processPrompt as jest.Mock).mockResolvedValue({
      deckName: 'Deck 1',
      cards: [],
    });

    const result = await controller.generate(dto, mockReq);
    expect(service.processPrompt).toHaveBeenCalledWith(dto, 'user1');
    expect(result.deckName).toBe('Deck 1');
  });
});
