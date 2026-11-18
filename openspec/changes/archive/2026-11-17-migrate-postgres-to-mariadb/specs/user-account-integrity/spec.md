## ADDED Requirements

### Requirement: Email uniqueness is case-insensitive
The system SHALL treat emails that differ only in letter case as the same email for uniqueness, so a second account cannot be created with a case variant of an existing email.

#### Scenario: Sign-up with a case variant of an existing email
- **WHEN** a user with email `joao@example.com` exists and a new account is created with `Joao@Example.com`
- **THEN** the request receives HTTP 409 and no new user is stored
