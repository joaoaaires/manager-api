import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { loadValidation } from './config/load.validation';
import { loadConfig } from './config/load.config';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      validate: loadValidation,
      isGlobal: true,
      cache: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60000, limit: 60 }],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: ThrottlerExceptionFilter },
  ],
})
export class AppModule {}
