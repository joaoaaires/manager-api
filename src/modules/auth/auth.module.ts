import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
          issuer: configService.getOrThrow<string>('jwtIssuer'), // Define quem emitiu o token.
          audience: configService.getOrThrow<string>('jwtAudience'), // Define para quem o token foi emitido.
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthStrategy, AuthService],
})
export class AuthModule {}
