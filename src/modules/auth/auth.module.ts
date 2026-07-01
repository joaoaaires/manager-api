import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UserModule } from '../user/user.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AUTH_SERVICE } from './services/auth.service.interface';
import { AuthStrategy } from './auth.strategy';

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
