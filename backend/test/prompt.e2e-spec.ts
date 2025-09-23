

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // ✅ default import
import { AppModule } from '@/app.module';
import { UserRepository } from '@/file-processing/repositories/user.repository';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';

describe('PromptProcessingController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UserRepository)
      .useValue({
        findUserApiKey: jest
          .fn()
          .mockResolvedValue({ openAiApiKey: 'test-key' }),
      })
      .overrideGuard(JwtAuthGuard) // ✅ mock auth guard
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/prompt/generate (POST) - success', async () => {
    const response = await request(app.getHttpServer())
      .post('/prompt/generate')
      .send({ text: 'Test prompt', deckName: 'Deck 1' });

    expect([200, 201]).toContain(response.status);
    expect(response.body.deckName).toBe('Deck 1');
  });

  afterAll(async () => {
    await app.close();
  });
});
