import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessingController } from './file-processing.controller';
import { FileProcessingService } from './file-processing.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

describe('FileProcessingController', () => {
  let controller: FileProcessingController;

  beforeEach(async () => {
    const mockFileProcessingService = {
      uploadSingleFile: jest.fn().mockImplementation(() =>
        Promise.resolve({
          id: 'test-id',
          filename: 'test-file.pdf',
          originalname: 'test.pdf',
          flashcardGenerationStatus: 'skipped',
        })
      ),
      uploadMultipleFiles: jest
        .fn()
        .mockImplementation(() => Promise.resolve([])),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileProcessingController],
      providers: [
        { provide: FileProcessingService, useValue: mockFileProcessingService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FileProcessingController>(FileProcessingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
