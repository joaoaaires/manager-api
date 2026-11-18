## ADDED Requirements

### Requirement: Database URL must target MariaDB
The system SHALL accept `DATABASE_URL` only when it is a MySQL/MariaDB connection URL using the `mysql://` or `mariadb://` scheme, and SHALL fail configuration loading otherwise.

#### Scenario: MariaDB connection URL
- **WHEN** `DATABASE_URL` is `mysql://manager:secret@192.168.100.180:3306/manager`
- **THEN** the configuration loading SHALL succeed

#### Scenario: Leftover PostgreSQL connection URL
- **WHEN** `DATABASE_URL` is `postgres://localhost:5432/db`
- **THEN** the system SHALL throw a validation error indicating that `DATABASE_URL` is invalid
