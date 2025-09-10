import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should register a new user (201)', async () => {
      const user = { email: 'user1@example.com', password: 'Password@123' };

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(201);

      expect(res.body).toHaveProperty(
        'message',
        'User registered successfully'
      );
      expect(res.body).toHaveProperty('userId');
    });

    it('should register another valid user (201)', async () => {
      const user = { email: 'user2@example.com', password: 'Password@123' };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(201);
    });

    it('should fail with weak password (400)', async () => {
      const user = { email: 'user3@example.com', password: 'pass' }; // weak password

      const res = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(400);

      expect(res.body.message).toContain(
        'Password must be at least 8 characters long, include 1 uppercase, 1 lowercase, and 1 number'
      );
    });

    it('should fail with invalid email (400)', async () => {
      const user = { email: 'invalid-email', password: 'Password@123' };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials (201)', async () => {
      // login returns 200
      const user = { email: 'user1@example.com', password: 'Password@123' };

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken'); // match camelCase from AuthService
    });

    it('should login another registered user (201)', async () => {
      const user = { email: 'user2@example.com', password: 'Password@123' };

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(user)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('should fail with wrong password (401)', async () => {
      const user = { email: 'user1@example.com', password: 'WrongPassword' };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(user)
        .expect(401);
    });

    it('should fail with empty password (400)', async () => {
      const user = { email: 'user1@example.com', password: '' };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(user)
        .expect(400);
    });
  });
});
