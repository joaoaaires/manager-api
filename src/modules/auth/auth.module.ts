import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UserModule } from '../user/user.module.js';
import { AuthController } from './controllers/auth.controller.js';
import { AuthService } from './services/auth.service.js';
import { AUTH_SERVICE } from './services/auth.service.interface.js';
import { AuthStrategy } from './auth.strategy.js';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('secret'),
        signOptions: {
          expiresIn: configService.get<number>('jwtExpiresIn') ?? 86400,
          issuer: configService.getOrThrow<string>('jwtIssuer'),
          audience: configService.getOrThrow<string>('jwtAudience'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthStrategy,
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
  ],
})
export class AuthModule {}
