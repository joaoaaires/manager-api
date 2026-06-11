## ADDED Requirements

### Requirement: Security headers are applied to all responses
The application SHALL apply `helmet` middleware with its default protections to every HTTP response.

#### Scenario: Responses carry security headers
- **WHEN** any endpoint is called
- **THEN** the response includes helmet default headers (e.g., `X-Content-Type-Options: nosniff`)

#### Scenario: Swagger UI remains functional
- **WHEN** `GET /docs` is accessed with helmet enabled
- **THEN** the Swagger UI renders and can execute requests

### Requirement: CORS is explicitly configured
The application SHALL enable CORS with an origin taken from the `CORS_ORIGIN` environment variable, defaulting to `*` when unset.

#### Scenario: Configured origin is honored
- **WHEN** `CORS_ORIGIN` is set and a preflight request arrives from that origin
- **THEN** the response allows the configured origin

### Requirement: Authentication endpoints are rate limited
The system SHALL apply a global request rate limit per client IP and a stricter limit on `POST /sign-up` and `POST /sign-in`. Requests exceeding the limit SHALL receive HTTP 429.

#### Scenario: Excessive sign-in attempts are throttled
- **WHEN** a client exceeds the auth-specific limit on `POST /sign-in` within the time window
- **THEN** subsequent requests receive HTTP 429 until the window resets

#### Scenario: Normal traffic is unaffected
- **WHEN** a client stays within the configured limits
- **THEN** requests are processed normally

### Requirement: Password input has a maximum length
`CreateUserDto.password` SHALL reject passwords longer than 72 characters (bcrypt input limit), returning a validation error.

#### Scenario: Oversized password is rejected
- **WHEN** `POST /sign-up` is called with a password longer than 72 characters
- **THEN** the response is HTTP 400 with a validation message
