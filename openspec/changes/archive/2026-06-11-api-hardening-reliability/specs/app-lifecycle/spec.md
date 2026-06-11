## ADDED Requirements

### Requirement: Prisma disconnects on application shutdown
`PrismaService` SHALL implement `OnModuleDestroy` and call `$disconnect()` when the application shuts down. The application bootstrap SHALL enable NestJS shutdown hooks so termination signals trigger module destroy lifecycle events.

#### Scenario: Graceful shutdown closes database connections
- **WHEN** the application receives a termination signal or `app.close()` is called
- **THEN** `PrismaService.$disconnect()` is invoked and no open database handles remain

#### Scenario: Test teardown leaves no open handles
- **WHEN** an e2e test suite calls `app.close()` in its teardown
- **THEN** the Jest worker exits without the "failed to exit gracefully" warning

### Requirement: Bootstrap uses structured logging
The application bootstrap SHALL use the NestJS `Logger` instead of `console.log` for startup messages.

#### Scenario: Startup message goes through Logger
- **WHEN** the application finishes bootstrapping
- **THEN** the listening port is logged via the NestJS `Logger` with a context label
