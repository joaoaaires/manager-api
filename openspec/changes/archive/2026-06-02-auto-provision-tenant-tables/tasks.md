## 1. Setup & Infrastructure

- [x] 1.1 Create `TenantProvisioningService` to handle DDL execution.
- [x] 1.2 Define the SQL DDL for the `notes` table.

## 2. Core Implementation

- [x] 2.1 Implement the provisioning logic using `PrismaService.$executeRawUnsafe`.
- [x] 2.2 Update the user registration flow in `UserService` to call the provisioning service.
- [x] 2.3 Ensure the provisioning happens immediately after the `CREATE SCHEMA` command.
- [x] 2.4 Implement error handling to ensure registration fails if provisioning fails.

## 3. Verification

- [x] 3.1 Update `test/user-tenant.e2e-spec.ts` to verify the presence of the `notes` table in the new tenant schema.
- [x] 3.2 Run E2E tests to validate the full registration and provisioning flow.
