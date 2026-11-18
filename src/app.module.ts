import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { loadConfig } from './config/load.config.js';
import { loadValidation } from './config/load.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UserModule } from './modules/user/user.module.js';
import { WebsocketModule } from './modules/websocket/websocket.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      validate: loadValidation,
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ limit: 100, ttl: 60000 }],
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    HealthModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
