import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async provisionTenant(tenantName: string): Promise<void> {
    this.logger.log(`Provisioning tables for tenant: ${tenantName}`);

    const ddl = `
      CREATE TABLE "${tenantName}"."notes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "text" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3)
      );
    `;

    try {
      await this.prisma.$executeRawUnsafe(ddl);
      this.logger.log(
        `Successfully provisioned tables for tenant: ${tenantName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to provision tables for tenant: ${tenantName}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to provision tenant tables: ${error.message}`,
      );
    }
  }
}
