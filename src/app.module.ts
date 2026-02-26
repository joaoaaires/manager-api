import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SqliteConfigService } from './config/sqlite.config.service';
import { loadValidation } from './config/load.validation';
import { loadConfig } from './config/load.config';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      validate: loadValidation,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: SqliteConfigService,
    }),
    AuthModule,
    HealthModule,
  ],
  controllers: [],
})
export class AppModule {}
