import { Module } from '@nestjs/common';

import { TenantProvisioningModule } from '../tenant/tenant-provisioning.module';
import { UserService } from './user.service';

@Module({
  imports: [TenantProvisioningModule],
  controllers: [],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
