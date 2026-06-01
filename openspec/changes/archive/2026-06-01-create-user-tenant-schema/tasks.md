## 1. Database Model Update

- [x] 1.1 Update `prisma/schema.prisma` to add `tenant_name` field (string, unique) to the `User` model.
- [x] 1.2 Run `npx prisma migrate dev --name add_tenant_name_to_user` to apply the database change.

## 2. User Service Implementation

- [x] 2.1 Update `src/modules/user/user.service.ts` imports to include `randomBytes` from `crypto`.
- [x] 2.2 Add a private helper method `generateTenantName()` to `UserService` that returns a string in the format `tenant_<8char_hex>`.
- [x] 2.3 Modify the `create` method in `UserService` to generate a `tenantName`.
- [x] 2.4 Update the user creation logic in `create` to include the `tenant_name` in the Prisma `create` call.
- [x] 2.5 Implement a call to `this.prisma.$executeRawUnsafe(`CREATE SCHEMA "${tenantName}"`)` within the `create` method, ideally before or as part of the user creation logic.

## 3. Verification and Testing

- [x] 3.1 Create a test script or use an existing test to verify that creating a user results in a new schema in the database.
- [x] 3.2 Verify that the `tenant_name` is correctly stored in the `User` table.
- [x] 3.3 Verify that if the schema creation fails (e.g., name collision, though unlikely), the user is not created.
