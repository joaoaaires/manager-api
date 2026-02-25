import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserEntity } from './../src/modules/user/entities/user.entity';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { SqliteConfigService } from './../src/config/sqlite.config.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    process.env.SALT = '10';
    process.env.SECRET = 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SqliteConfigService)
      .useValue({
        createTypeOrmOptions: () => ({
          type: 'sqlite',
          database: ':memory:',
          entities: [UserEntity],
          synchronize: true,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return 200 with { status: "ok" }', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({ status: 'ok' });
    });
  });

  describe('POST /sign-up', () => {
    it('should return 201 with user data and token (no password)', async () => {
      const response = await request(app.getHttpServer())
        .post('/sign-up')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('createAt');
      expect(response.body).toHaveProperty('updateAt');
      expect(response.body).toHaveProperty('token');
      expect(response.body).not.toHaveProperty('password');

      token = response.body.token;
    });

    it('should return 409 on duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/sign-up')
        .send({
          name: 'Another User',
          email: 'test@example.com',
          password: 'password456',
        })
        .expect(409);
    });
  });

  describe('POST /sign-in', () => {
    it('should return 201 with token', async () => {
      const response = await request(app.getHttpServer())
        .post('/sign-in')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('createAt');
      expect(response.body).toHaveProperty('updateAt');
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 on wrong password', async () => {
      await request(app.getHttpServer())
        .post('/sign-in')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 404 on non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/sign-in')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(404);
    });
  });

  describe('GET /profile', () => {
    it('should return 200 with user data when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('createAt');
      expect(response.body).toHaveProperty('updateAt');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('token');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/profile').expect(401);
    });
  });
});
