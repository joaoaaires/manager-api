## ADDED Requirements

### Requirement: Health endpoint verifies database connectivity
The `GET /health` endpoint SHALL include a database connectivity check using the Prisma connection. The endpoint SHALL return HTTP 200 only when the database responds, and HTTP 503 when it does not.

#### Scenario: Healthy database
- **WHEN** `GET /health` is called and the database responds to a ping
- **THEN** the response is HTTP 200 with a `database` indicator marked `up`

#### Scenario: Unreachable database
- **WHEN** `GET /health` is called and the database does not respond
- **THEN** the response is HTTP 503 with the `database` indicator marked `down`
