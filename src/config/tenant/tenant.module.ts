import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Module({
  imports: [],
  controllers: [],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
