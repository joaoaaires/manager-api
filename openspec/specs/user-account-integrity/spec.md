# user-account-integrity Specification

## Purpose
TBD - created by archiving change api-hardening-reliability. Update Purpose after archive.
## Requirements
### Requirement: Duplicate email race resolves to a conflict error
`UserService.create()` SHALL map Prisma unique-constraint violations (`P2002`) on the email column to `EmailAlreadyExistsException` (HTTP 409). The existing tenant schema rollback SHALL still execute before the exception is thrown.

#### Scenario: Concurrent sign-up with the same email
- **WHEN** two requests create the same email concurrently and the second insert violates the unique constraint
- **THEN** the second request receives HTTP 409 (not 500) and its orphaned tenant schema is dropped

### Requirement: Soft-deleted users are excluded from reads and authentication
`UserService.readOneByEmail()` and `UserService.readOneById()` SHALL only return users whose `deleteAt` is null. A soft-deleted user SHALL NOT be able to authenticate or retrieve a profile.

#### Scenario: Soft-deleted user cannot sign in
- **WHEN** `POST /sign-in` is called with credentials of a user whose `deleteAt` is set
- **THEN** the request fails as if the user did not exist

#### Scenario: Soft-deleted user token cannot access profile
- **WHEN** `GET /profile` is called with a token whose subject is a soft-deleted user
- **THEN** the response is an error and no profile data is returned

