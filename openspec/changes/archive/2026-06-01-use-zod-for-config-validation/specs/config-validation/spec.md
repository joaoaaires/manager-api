## ADDED Requirements

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
