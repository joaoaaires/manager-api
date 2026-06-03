## Why

Ensuring consistency across tenant environments is critical. Every new tenant needs a baseline set of tables for core features (like notes) to be available immediately upon registration. Automating this provisioning step eliminates manual setup errors and ensures all tenants are ready for use immediately.

## What Changes

- Enhance the tenant creation flow to include a "provisioning" phase.
- Immediately after `CREATE SCHEMA`, the system will execute a set of standard DDL scripts to create base tables.
- Initial standard table: `notes` with columns `id`, `text`, `createdAt`, `updatedAt`, and `deletedAt`.
- Ensure the provisioning phase is transactional or idempotent with the user creation.

## Capabilities

### New Capabilities
- `tenant-table-provisioning`: Automatically create a standard set of tables within a newly created tenant schema.

### Modified Capabilities
- `multi-tenancy-schema-isolation`: Extend the "Automated Database Schema Creation" requirement to include table provisioning after schema creation.

## Impact

- `UserService`: Update the registration logic to call the provisioning service.
- `PrismaService`: Update or extend to handle DDL execution for specific schemas.
- Database: New tables will be created in each new tenant schema.
