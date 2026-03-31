import { Module } from '@nestjs/common';

import { CryptoModule } from '@common/crypto/crypto.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
