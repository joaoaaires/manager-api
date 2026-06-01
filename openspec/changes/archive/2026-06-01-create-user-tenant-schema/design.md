## Context

The system currently stores all data in a single public schema. To support multi-tenancy, we are introducing isolated database schemas for each user. This requires modifications to the database model and the user creation workflow.

## Goals / Non-Goals

**Goals:**
- Add `tenant_name` to the `User` model.
- Automatically generate a unique `tenant_name` (pattern: `tenant_<8char_hex>`).
- Execute `CREATE SCHEMA` during the user creation process.
- Ensure the user record is not successfully created if the schema creation fails.

**Non-Goals:**
- Retroactive migration of existing users to individual schemas.
- Implementation of multi-tenant data access (routing queries to the correct schema) - this will be addressed in future changes.

## Decisions

### 1. Tenant Name Generation
- **Decision**: Use `crypto.randomBytes(4).toString('hex')` to generate the 8-character suffix.
- **Rationale**: Provides a sufficiently large space to avoid collisions while keeping the name readable.
- **Alternatives**: Using UUIDs (too long for schema names in some DBs or just clunky), sequential IDs (predictable and potentially less secure if exposed).

### 2. Schema Creation Implementation
- **Decision**: Use `prisma.$executeRawUnsafe` to execute `CREATE SCHEMA "${tenantName}"`.
- **Rationale**: DDL statements like `CREATE SCHEMA` do not support parameters in most database drivers, requiring raw string interpolation.
- **Security**: The `tenantName` is generated internally following a strict pattern (`tenant_` + hex), mitigating SQL injection risks.

### 3. Transactional Integrity
- **Decision**: Wrap user creation and schema creation in a logic-level check.
- **Rationale**: While DDL often cannot be part of a standard ACID transaction in all databases, we will ensure that the user creation service method throws an exception if schema creation fails, preventing the application from proceeding as if the user were fully provisioned.

## Risks / Trade-offs

- **[Risk] SQL Injection via schema names** → [Mitigation] Strictly control the generation of the `tenant_name` string to only include alphanumeric characters and underscores.
- **[Risk] Schema creation limits** → [Mitigation] Most modern databases support thousands of schemas, but we should monitor performance as the user base grows.
- **[Risk] DDL not being transactional** → [Mitigation] If user creation succeeds but schema fails, we might end up with "ghost" users. We should ideally create the schema *before* or *during* the user creation transaction if possible, or have a cleanup/retry mechanism.
