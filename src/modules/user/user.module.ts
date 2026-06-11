import { Module } from '@nestjs/common';

import { TenantProvisioningModule } from '../tenant/tenant-provisioning.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TenantProvisioningModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
