## Why

To support multi-tenancy and data isolation, each user needs their own dedicated database schema. This change automates the creation of these schemas during user registration, ensuring that every user has a private space for their data from the start.

## What Changes

- **Database Schema**: Add a `tenant_name` field to the `User` table in `prisma/schema.prisma`.
- **User Service**: Modify `UserService.create` to:
    - Generate a unique `tenant_name` following the pattern `tenant_<random_suffix>`.
    - Create a new database schema using the generated name.
    - Store the `tenant_name` in the user record.
- **Prisma Integration**: Use Prisma's `$executeRaw` or a similar mechanism to run the `CREATE SCHEMA` command.

## Capabilities

### New Capabilities
- `multi-tenancy-schema-isolation`: Automated creation and management of isolated database schemas for each user to ensure data privacy and organization.

### Modified Capabilities
- (None)

## Impact

- `prisma/schema.prisma`: Modified to include the new `tenant_name` field.
- `src/modules/user/user.service.ts`: Core logic for user creation updated with schema generation.
- Database: New schemas will be created dynamically.
- `User` DTOs: Might need updates to include or exclude the `tenant_name` in responses.
