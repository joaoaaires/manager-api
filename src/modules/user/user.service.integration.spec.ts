import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CryptoModule } from '@common/crypto/crypto.module';
import { loadConfig } from '@config/load.config';
import { loadValidation } from '@config/load.validation';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { PrismaService } from '@modules/prisma/prisma.service';

import { EmailAlreadyExistsException } from './errors/email-already-exists.exception';
import { UserService } from './user.service';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === '1';

(runIntegration ? describe : describe.skip)(
  'UserService (integration — duplicate email)',
  () => {
    let app: INestApplication;
    let userService: UserService;
    let prisma: PrismaService;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            load: [loadConfig],
            validate: loadValidation,
            isGlobal: true,
            cache: true,
          }),
          PrismaModule,
          CryptoModule,
        ],
        providers: [UserService],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
      userService = app.get(UserService);
      prisma = app.get(PrismaService);
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: { endsWith: '@integration-dup.manager-api.local' } },
      });
      await app.close();
    });

    it('SHALL reject second create with same email', async () => {
      const email = `dup-${Date.now()}@integration-dup.manager-api.local`;
      const dto = {
        name: 'Integration User',
        email,
        password: 'Secret12345',
      };

      await userService.create(dto);

      await expect(
        userService.create({ ...dto, name: 'Other' }),
      ).rejects.toThrow(EmailAlreadyExistsException);
    });
  },
);
