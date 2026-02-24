import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { loadConfig } from './config/load.config';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqliteConfigService } from './config/sqlite.config.service';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: SqliteConfigService,
      inject: [SqliteConfigService],
    }),
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
