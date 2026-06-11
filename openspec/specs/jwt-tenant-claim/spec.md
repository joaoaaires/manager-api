# jwt-tenant-claim Specification

## Purpose
TBD - created by archiving change jwt-tenant-claim. Update Purpose after archive.
## Requirements
### Requirement: JWT carries the user tenant as a claim
Tokens issued by `AuthService.register()` and `AuthService.access()` SHALL include the user's `tenant_name` in a `tenant` claim alongside `sub`.

#### Scenario: Sign-up token contains tenant claim
- **WHEN** `POST /sign-up` succeeds
- **THEN** the returned JWT payload contains `sub` with the user id and `tenant` with the user's `tenant_name`

#### Scenario: Sign-in token contains tenant claim
- **WHEN** `POST /sign-in` succeeds
- **THEN** the returned JWT payload contains `sub` and `tenant` for the authenticated user

### Requirement: Tenant claim is validated before being propagated
`AuthStrategy.validate()` SHALL reject tokens whose `tenant` claim is missing or does not match `^[a-z_][a-z0-9_]{0,62}$`, resulting in HTTP 401. The same pattern constant used by `TenantProvisioningService` SHALL be shared, not duplicated.

#### Scenario: Valid claim is propagated to request.user
- **WHEN** a request carries a token with a well-formed `tenant` claim
- **THEN** `request.user` contains `{ id, tenantName }` with the claim value

#### Scenario: Token without tenant claim is rejected
- **WHEN** a request carries a token signed before this change (no `tenant` claim)
- **THEN** the response is HTTP 401

#### Scenario: Malformed tenant claim is rejected
- **WHEN** a request carries a token whose `tenant` claim contains characters outside `[a-z0-9_]` or starts with a digit
- **THEN** the response is HTTP 401 and the claim value is never used

### Requirement: Tenant name is not exposed in API response bodies
API responses SHALL NOT expose the `tenant_name` field. The tenant travels exclusively inside the signed JWT.

#### Scenario: Sign-up response omits tenant_name
- **WHEN** `POST /sign-up` or `POST /sign-in` succeeds
- **THEN** the response body does not contain a `tenant_name` field

