## ADDED Requirements

### Requirement: Standard Table Provisioning
The system SHALL automatically create a standard set of tables within a new tenant schema immediately after the schema is created.

#### Scenario: Successful table provisioning
- **WHEN** a new tenant schema is created
- **THEN** the system MUST execute DDL to create the `notes` table in that schema with columns `id`, `text`, `createdAt`, `updatedAt`, and `deletedAt`.

### Requirement: Provisioning Transactional Integrity
The system SHALL ensure that if table provisioning fails, the entire tenant registration process (including user creation and schema creation) is rolled back or marked as failed.

#### Scenario: Rollback on provisioning failure
- **WHEN** the table creation DDL fails during tenant registration
- **THEN** the system MUST throw an error and ensure the tenant is not considered provisioned.
