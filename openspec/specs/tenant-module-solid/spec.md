### Requirement: TenantProvisioningService interface with symbolic token
The tenant module SHALL define an `ITenantProvisioningService` interface and a `TENANT_PROVISIONING_SERVICE` Symbol token in `src/modules/tenant/services/tenant-provisioning.service.interface.ts`. The interface SHALL expose `provisionTenant(tenantName: string): Promise<void>`.

#### Scenario: TenantProvisioningService resolves via token injection
- **WHEN** `TenantProvisioningModule` provides `{ provide: TENANT_PROVISIONING_SERVICE, useClass: TenantProvisioningService }`
- **THEN** any component injecting `@Inject(TENANT_PROVISIONING_SERVICE)` receives an `ITenantProvisioningService` instance

### Requirement: TenantProvisioningService moved to services/ subfolder
The `TenantProvisioningService` class SHALL be located at `src/modules/tenant/services/tenant-provisioning.service.ts` and SHALL implement `ITenantProvisioningService`. The file `src/modules/tenant/tenant-provisioning.service.ts` SHALL be removed.

#### Scenario: TenantProvisioningModule imports from services/ path
- **WHEN** `TenantProvisioningModule` is compiled
- **THEN** it imports `TenantProvisioningService` from `./services/tenant-provisioning.service`

### Requirement: TenantProvisioningService uses updated PrismaService import
`TenantProvisioningService` SHALL import `PrismaService` from `~/database/prisma.service` (the new path established by the database module refactor). It SHALL NOT reference the removed `../prisma/prisma.service` path.

#### Scenario: Compilation succeeds with new PrismaService path
- **WHEN** the project is compiled with `tsc` or `nest build`
- **THEN** no module-not-found error occurs for `prisma/prisma.service`

### Requirement: TenantProvisioningModule provides service via symbolic token
`TenantProvisioningModule` SHALL register `TenantProvisioningService` with `{ provide: TENANT_PROVISIONING_SERVICE, useClass: TenantProvisioningService }` and SHALL export the `TENANT_PROVISIONING_SERVICE` token.

#### Scenario: Module compiles and exposes the token
- **WHEN** `TenantProvisioningModule` is bootstrapped
- **THEN** consumers can inject `ITenantProvisioningService` via `TENANT_PROVISIONING_SERVICE` token
