## MODIFIED Requirements

### Requirement: JWT carries only the user subject as a claim
Tokens issued by `AuthService.register()` and `AuthService.access()` SHALL include only `sub` (the user id) in the JWT payload. The `tenant` claim SHALL NOT be present.

#### Scenario: Sign-up token contains only sub claim
- **WHEN** `POST /sign-up` succeeds
- **THEN** the returned JWT payload contains `sub` with the user id and no `tenant` field

#### Scenario: Sign-in token contains only sub claim
- **WHEN** `POST /sign-in` succeeds
- **THEN** the returned JWT payload contains only `sub` for the authenticated user

## REMOVED Requirements

### Requirement: JWT carries the user tenant as a claim
**Reason**: Tenant isolation has been removed from the domain. Users are no longer scoped to a tenant, so there is nothing to embed in the token.
**Migration**: Any client that relied on reading the `tenant` claim from the JWT must be updated to use a different authorization mechanism if tenant scoping is reintroduced.

### Requirement: Tenant claim is validated before being propagated
**Reason**: The `tenant` claim no longer exists in the JWT. `AuthStrategy.validate()` now returns `{ id }` only, with no pattern validation.
**Migration**: N/A — validation is removed along with the claim.
