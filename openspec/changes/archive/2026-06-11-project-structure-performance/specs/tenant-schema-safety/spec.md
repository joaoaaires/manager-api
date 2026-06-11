## ADDED Requirements

### Requirement: Tenant schema name is validated before DDL execution
`TenantProvisioningService` SHALL validate that a `tenantName` matches the pattern `^[a-z_][a-z0-9_]{0,62}$` before executing any `$executeRawUnsafe` DDL. If validation fails, the service SHALL throw a `BadRequestException` and SHALL NOT execute any DDL.

#### Scenario: Valid tenant name proceeds to provisioning
- **WHEN** `provisionTenant` is called with a name matching `^[a-z_][a-z0-9_]{0,62}$`
- **THEN** the DDL is executed and tables are created in the new schema

#### Scenario: Invalid tenant name is rejected before DDL
- **WHEN** `provisionTenant` is called with a name containing characters outside `[a-z0-9_]` or starting with a digit
- **THEN** the service throws `BadRequestException` and no DDL is executed

### Requirement: User creation rollback covers full creation sequence
`UserService.create()` SHALL drop the tenant schema if ANY step after schema creation fails, including `prisma.user.create()`. The rollback `DROP SCHEMA IF EXISTS ... CASCADE` SHALL execute whenever the schema was created but the user record was not persisted.

#### Scenario: Schema is cleaned up when user insert fails
- **WHEN** `provisionTenant` succeeds but `prisma.user.create()` throws an error
- **THEN** the orphaned schema is dropped via `DROP SCHEMA IF EXISTS ... CASCADE`
- **THEN** the original error is re-thrown to the caller

#### Scenario: Schema is cleaned up when provisioning fails
- **WHEN** `CREATE SCHEMA` succeeds but `provisionTenant` DDL fails
- **THEN** the orphaned schema is dropped via `DROP SCHEMA IF EXISTS ... CASCADE`
- **THEN** `InternalServerErrorException` is thrown

### Requirement: Timestamp fields follow standard naming convention
The `User` model in `schema.prisma` SHALL use `createdAt` and `updatedAt` field names. All DTOs and response objects SHALL reflect these names. A Prisma migration SHALL be generated to rename the columns in the database.

#### Scenario: UserResponseDto exposes createdAt and updatedAt
- **WHEN** `GET /profile` returns a user object
- **THEN** the response body contains `createdAt` and `updatedAt` fields (not `createAt`/`updateAt`)

#### Scenario: AuthResponseDto exposes createdAt and updatedAt
- **WHEN** `POST /sign-up` or `POST /sign-in` returns an auth response
- **THEN** the response body contains `createdAt` and `updatedAt` fields
