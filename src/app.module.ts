import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { loadValidation } from './config/load.validation';
import { loadConfig } from './config/load.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      validate: loadValidation,
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [],
})
export class AppModule {}
