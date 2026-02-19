import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import envs from 'src/config/load.config';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: envs.secret,
      signOptions: { expiresIn: '86400s' },
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
