import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const databaseUrl = configService.getOrThrow<string>('databaseUrl');
    const pool = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter: pool });
  }
  async onModuleInit() {
    // Note: this is optional
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
