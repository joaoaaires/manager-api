import { Module } from '@nestjs/common';

import { TenantProvisioningService } from './tenant-provisioning.service';

@Module({
  imports: [],
  controllers: [],
  providers: [TenantProvisioningService],
  exports: [TenantProvisioningService],
})
export class TenantProvisioningModule {}
