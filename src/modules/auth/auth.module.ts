import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UserModule } from '@modules/user/user.module';
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
        secret: configService.getOrThrow<string>('secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('jwtExpiresIn'),
          issuer: configService.getOrThrow<string>('jwtIssuer'),
          audience: configService.getOrThrow<string>('jwtAudience'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthStrategy, AuthService],
})
export class AuthModule {}
