# jwt-tenant-claim Specification

## Purpose
TBD - created by archiving change jwt-tenant-claim. Update Purpose after archive.
## Requirements
### Requirement: JWT carries only the user subject as a claim
Tokens issued by `AuthService.register()` and `AuthService.access()` SHALL include only `sub` (the user id) in the JWT payload. The `tenant` claim SHALL NOT be present.

#### Scenario: Sign-up token contains only sub claim
- **WHEN** `POST /sign-up` succeeds
- **THEN** the returned JWT payload contains `sub` with the user id and no `tenant` field

#### Scenario: Sign-in token contains only sub claim
- **WHEN** `POST /sign-in` succeeds
- **THEN** the returned JWT payload contains only `sub` for the authenticated user

### Requirement: Tenant name is not exposed in API response bodies
API responses SHALL NOT expose the `tenant_name` field. The tenant travels exclusively inside the signed JWT.

#### Scenario: Sign-up response omits tenant_name
- **WHEN** `POST /sign-up` or `POST /sign-in` succeeds
- **THEN** the response body does not contain a `tenant_name` field

