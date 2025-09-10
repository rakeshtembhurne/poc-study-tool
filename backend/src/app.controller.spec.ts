import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestHelpers } from '../test/utils/test-helpers';
import { TestingModule } from '@nestjs/testing';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await TestHelpers.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    });

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    it('should call appService.getHello', () => {
      const spy = jest.spyOn(appService, 'getHello');
      appController.getHello();
      expect(spy).toHaveBeenCalled();
    });
  });
});
