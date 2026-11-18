# config-validation Specification

## Purpose

Validates all required environment variables at startup so the API fails fast with a clear error instead of running with missing or malformed configuration.
## Requirements
### Requirement: Environment Variable Validation
The system SHALL validate all required environment variables using Zod schemas during the configuration loading phase.

#### Scenario: Valid configuration
- **WHEN** all required environment variables (PORT, DATABASE_URL, SALT, SECRET, JWT_EXPIRES_IN, JWT_ISSUER, JWT_AUDIENCE) are present and have the correct types
- **THEN** the configuration loading SHALL succeed and return the validated object

#### Scenario: Missing required variable
- **WHEN** any of the required environment variables is missing
- **THEN** the system SHALL throw a validation error indicating which variable is missing

#### Scenario: Invalid variable type
- **WHEN** an environment variable exists but has an invalid type (e.g., PORT is not a number)
- **THEN** the system SHALL throw a validation error indicating the type mismatch

### Requirement: Positive Number Constraints
The system SHALL ensure that numeric configuration values like PORT, SALT, and JWT_EXPIRES_IN are positive integers.

#### Scenario: Non-positive number provided
- **WHEN** the SALT environment variable is set to 0 or a negative number
- **THEN** the system SHALL throw a validation error

### Requirement: Database URL must target MariaDB
The system SHALL accept `DATABASE_URL` only when it is a MySQL/MariaDB connection URL using the `mysql://` or `mariadb://` scheme, and SHALL fail configuration loading otherwise.

#### Scenario: MariaDB connection URL
- **WHEN** `DATABASE_URL` is `mysql://manager:secret@192.168.100.180:3306/manager`
- **THEN** the configuration loading SHALL succeed

#### Scenario: Leftover PostgreSQL connection URL
- **WHEN** `DATABASE_URL` is `postgres://localhost:5432/db`
- **THEN** the system SHALL throw a validation error indicating that `DATABASE_URL` is invalid

