import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingController } from './file-processing.controller';
import { FileProcessingService } from './file-processing.service';

describe('FileProcessingController', () => {
  let controller: FileProcessingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileProcessingController],
      providers: [FileProcessingService],
    }).compile();

    controller = module.get<FileProcessingController>(FileProcessingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
