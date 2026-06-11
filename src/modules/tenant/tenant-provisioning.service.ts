import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TENANT_NAME_PATTERN = /^[a-z_][a-z0-9_]{0,62}$/;

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  async provisionTenant(tenantName: string): Promise<void> {
    if (!TENANT_NAME_PATTERN.test(tenantName)) {
      throw new BadRequestException(`Invalid tenant name: ${tenantName}`);
    }

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
      const stack = error instanceof Error ? error.stack : undefined;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to provision tables for tenant: ${tenantName}`,
        stack,
      );
      throw new InternalServerErrorException(
        `Failed to provision tenant tables: ${message}`,
      );
    }
  }
}
