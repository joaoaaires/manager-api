## ADDED Requirements

### Requirement: UserController exposes authenticated user profile
The system SHALL provide a `GET /profile` endpoint within `UserModule` via a dedicated `UserController`, protected by `AuthGuard`. The endpoint SHALL return the authenticated user's profile using `UserResponseDto`.

#### Scenario: Authenticated user retrieves profile
- **WHEN** a valid JWT bearer token is sent in the `Authorization` header to `GET /profile`
- **THEN** the system returns HTTP 200 with the user's `id`, `name`, `email`, `createdAt`, `updatedAt`

#### Scenario: Unauthenticated request is rejected
- **WHEN** `GET /profile` is called without a bearer token
- **THEN** the system returns HTTP 401 Unauthorized

### Requirement: AuthController is limited to authentication endpoints
The `AuthController` SHALL only expose `POST /sign-up` and `POST /sign-in`. It SHALL NOT inject `UserService` directly or expose profile-related endpoints.

#### Scenario: sign-up creates user and returns token
- **WHEN** `POST /sign-up` is called with valid `name`, `email`, and `password`
- **THEN** the system returns HTTP 201 with `AuthResponseDto` containing a JWT token

#### Scenario: sign-in authenticates user and returns token
- **WHEN** `POST /sign-in` is called with valid `email` and `password`
- **THEN** the system returns HTTP 200 with `AuthResponseDto` containing a JWT token

### Requirement: UserModule is registered in AppModule
`UserModule` SHALL be explicitly listed in `AppModule.imports`. The application SHALL NOT rely on transitive module loading for `UserModule`.

#### Scenario: Application bootstraps with explicit UserModule
- **WHEN** the NestJS application initializes
- **THEN** `UserModule` is resolved directly from `AppModule` dependency graph without requiring `AuthModule` to be present
