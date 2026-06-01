import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('User Tenant Schema (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Cleanup users created during tests
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-tenant',
        },
      },
    });
    await app.close();
  });

  it('should create a user and a corresponding database schema', async () => {
    const email = `test-tenant-${Date.now()}@example.com`;
    const response = await request(app.getHttpServer())
      .post('/sign-up')
      .send({
        name: 'Test User',
        email: email,
        password: 'password123',
      })
      .expect(201);

    const user = response.body;
    expect(user.email).toBe(email);
    expect(user.tenant_name).toBeDefined();
    expect(user.tenant_name).toMatch(/^tenant_[a-f0-9]{8}$/);

    // Verify schema exists in DB
    const schemaExists = await prisma.$queryRawUnsafe(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = '${user.tenant_name}'
    `);
    
    expect(schemaExists).toHaveLength(1);

    // Cleanup: Drop the created schema
    await prisma.$executeRawUnsafe(`DROP SCHEMA "${user.tenant_name}" CASCADE`);
  });
});
