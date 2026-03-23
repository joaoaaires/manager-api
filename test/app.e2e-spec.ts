import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { applyCorrelationMiddleware } from './../src/common/middleware/correlation.middleware';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/prisma/prisma.service';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        user: {
          findFirst: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
      } as unknown as PrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    applyCorrelationMiddleware(app);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res: { body: { status: string } }) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body.status).toBe('ok');
      });
  });

  it('returns X-Request-Id header', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
  });

  it('echoes incoming X-Request-Id', async () => {
    const id = 'e2e-correlation-test-id';
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('X-Request-Id', id)
      .expect(200);
    expect(res.headers['x-request-id']).toBe(id);
  });
});
