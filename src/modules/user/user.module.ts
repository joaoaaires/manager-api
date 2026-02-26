import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TenantModule } from '../../config/tenant/tenant.module';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), TenantModule],
  controllers: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
