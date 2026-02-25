# Requirements Document

## Introduction

This document defines the requirements for improving the existing manager-api NestJS 11 codebase. The improvements target security vulnerabilities (password hash leaks), broken dependency injection patterns, missing test coverage, incomplete Swagger documentation, weak TypeScript strictness, and missing operational features (logging, CORS, health check). The goal is to bring the codebase up to modern NestJS 11 standards.

## Glossary

- **API**: The manager-api NestJS 11 REST backend application
- **Swagger_Docs**: The OpenAPI documentation served at the `/docs` endpoint
- **Auth_Module**: The NestJS module responsible for JWT-based authentication (sign-up, sign-in, profile)
- **Auth_Guard**: The NestJS CanActivate guard that validates JWT Bearer tokens
- **User_Entity**: The TypeORM entity representing a user record in the SQLite database
- **User_Service**: The NestJS service responsible for user CRUD operations
- **Auth_Service**: The NestJS service responsible for authentication logic (register, access, profile)
- **Config_Service**: The NestJS `@nestjs/config` ConfigService used for runtime configuration access
- **Response_DTO**: A Data Transfer Object used to shape API responses and exclude sensitive fields
- **Exception_Filter**: A NestJS global exception filter that catches and formats unhandled errors
- **Logger**: The NestJS built-in Logger class used for structured application logging
- **Health_Endpoint**: An HTTP GET endpoint that returns the operational status of the API
- **User_Controller**: The NestJS controller under `src/modules/user/` currently containing no route handlers
- **Validation_Pipe**: The global NestJS pipe that validates incoming request bodies using class-validator

## Requirements

### Requirement 1: Secure API Responses — Prevent Password Hash Leakage

**User Story:** As a developer, I want API responses to exclude the password hash from User_Entity data, so that sensitive credentials are never exposed to clients.

#### Acceptance Criteria

1. THE Auth_Service SHALL return user data through a Response_DTO that excludes the password field, instead of using destructuring spread on the raw entity
2. WHEN the sign-up endpoint returns a user, THE API SHALL include only the id, name, email, createAt, updateAt, and token fields in the response body
3. WHEN the sign-in endpoint returns a user, THE API SHALL include only the id, name, email, createAt, updateAt, and token fields in the response body
4. WHEN the profile endpoint returns a user, THE API SHALL include only the id, name, email, createAt, and updateAt fields in the response body
5. THE User_Entity SHALL annotate the password column with `@Exclude()` from class-transformer as a defense-in-depth measure
6. THE API SHALL apply `ClassSerializerInterceptor` globally so that `@Exclude()` annotations are enforced on all responses

### Requirement 2: Swagger/OpenAPI Documentation

**User Story:** As a developer, I want complete and accurate Swagger documentation, so that API consumers can understand and integrate with all endpoints.

#### Acceptance Criteria

1. THE Swagger_Docs SHALL display the title "Manager API" and a description that accurately reflects the user management purpose
2. THE Swagger_Docs SHALL include a Bearer authentication scheme so that authenticated endpoints can be tested from the Swagger UI
3. WHEN the sign-up endpoint is documented, THE Swagger_Docs SHALL show the request body schema (name, email, password), the 201 success response schema, and the 409 conflict response
4. WHEN the sign-in endpoint is documented, THE Swagger_Docs SHALL show the request body schema (email, password), the 201 success response schema, and the 401 unauthorized response
5. WHEN the profile endpoint is documented, THE Swagger_Docs SHALL show the 200 success response schema, the 401 unauthorized response, and the Bearer authentication requirement
6. THE API DTOs (CreateUserDto, SignInDto) SHALL use `@ApiProperty()` decorators on each field so that Swagger_Docs displays field descriptions and types
7. THE Response_DTO classes SHALL use `@ApiProperty()` decorators so that Swagger_Docs displays the response schema accurately

### Requirement 3: Dependency Injection for Configuration

**User Story:** As a developer, I want all configuration values accessed through NestJS ConfigService, so that the application is testable and follows NestJS dependency injection patterns.

#### Acceptance Criteria

1. THE Auth_Guard SHALL retrieve the JWT secret from Config_Service instead of importing the envs object directly
2. THE Auth_Module SHALL register JwtModule using `registerAsync` with Config_Service to provide the secret and sign options, instead of using `register` with a static import
3. THE User_Service SHALL retrieve the bcrypt salt rounds from Config_Service instead of importing the envs object directly
4. THE SqliteConfigService SHALL retrieve the database file name from Config_Service instead of reading `process.env` directly
5. THE API SHALL validate that the SALT environment variable parses to a valid positive integer, and IF the SALT value is not a valid positive integer, THEN THE API SHALL fail to start with a descriptive error message
6. THE API SHALL validate that the SECRET environment variable is defined and non-empty, and IF the SECRET value is missing, THEN THE API SHALL fail to start with a descriptive error message

### Requirement 4: Global Exception Filter and Logging

**User Story:** As a developer, I want a global exception filter and structured logging, so that errors are handled consistently and application behavior is observable.

#### Acceptance Criteria

1. THE API SHALL register a global exception filter that catches all unhandled exceptions and returns a consistent JSON error response with statusCode, message, and timestamp fields
2. WHEN an unhandled exception occurs, THE Exception_Filter SHALL log the error details (status code, path, message, stack trace) using the NestJS Logger
3. THE API bootstrap process SHALL use the NestJS Logger instead of `console.log` for startup messages and error reporting
4. IF an HTTP exception is thrown, THEN THE Exception_Filter SHALL preserve the original HTTP status code and message from the exception
5. IF a non-HTTP exception is thrown, THEN THE Exception_Filter SHALL return a 500 Internal Server Error status code with a generic error message

### Requirement 5: Unit Test Coverage

**User Story:** As a developer, I want unit tests for all services and guards, so that business logic is verified and regressions are caught early.

#### Acceptance Criteria

1. THE Auth_Service SHALL have unit tests covering the register, access, and profile methods with mocked dependencies (UserService, JwtService)
2. THE User_Service SHALL have unit tests covering the create and readOneByEmail methods with a mocked UserRepository
3. THE Auth_Guard SHALL have unit tests verifying token extraction, successful validation, and rejection of missing or invalid tokens
4. WHEN a unit test for Auth_Service register is executed, THE test SHALL verify that the response excludes the password field
5. WHEN a unit test for User_Service create is executed with a duplicate email, THE test SHALL verify that an EmailAlreadyExistsException is thrown
6. WHEN a unit test for User_Service readOneByEmail is executed with a non-existent email, THE test SHALL verify that a UserNotFoundException is thrown

### Requirement 6: Fix E2E Test Suite

**User Story:** As a developer, I want a working e2e test suite, so that API integration behavior is validated end-to-end.

#### Acceptance Criteria

1. THE e2e test suite SHALL test the POST /sign-up endpoint with valid input and verify a 201 status code and a response body containing id, name, email, and token
2. THE e2e test suite SHALL test the POST /sign-in endpoint with valid credentials and verify a 201 status code and a response body containing a token
3. THE e2e test suite SHALL test the GET /profile endpoint with a valid Bearer token and verify a 200 status code and a response body containing user data without a password field
4. THE e2e test suite SHALL test the GET /profile endpoint without a Bearer token and verify a 401 status code
5. THE e2e test suite SHALL use an isolated in-memory or temporary SQLite database so that tests do not affect production data

### Requirement 7: User Entity Data Integrity

**User Story:** As a developer, I want the User_Entity to have correct column types and constraints, so that data integrity is enforced at the database level.

#### Acceptance Criteria

1. THE User_Entity SHALL type the createAt, updateAt, and deleteAt fields as `Date` instead of `string`
2. THE User_Entity SHALL define a unique constraint on the email column so that the database rejects duplicate email inserts
3. WHEN a user record is created, THE User_Entity createAt and updateAt fields SHALL contain valid Date values

### Requirement 8: CORS Configuration and Health Check

**User Story:** As a developer, I want CORS enabled and a health check endpoint, so that the API is accessible from frontend clients and its availability is monitorable.

#### Acceptance Criteria

1. THE API SHALL enable CORS in the bootstrap process with configurable allowed origins
2. THE API SHALL expose a GET /health endpoint that returns a 200 status code with a JSON body containing a status field set to "ok"
3. THE Health_Endpoint SHALL respond without requiring authentication

### Requirement 9: TypeScript Strictness

**User Story:** As a developer, I want stricter TypeScript compiler options, so that type-related bugs are caught at compile time.

#### Acceptance Criteria

1. THE tsconfig.json SHALL set `noImplicitAny` to `true`
2. THE tsconfig.json SHALL set `strictBindCallApply` to `true`
3. THE tsconfig.json SHALL set `noFallthroughCasesInSwitch` to `true`
4. WHEN the stricter compiler options are enabled, THE API codebase SHALL compile without type errors

### Requirement 10: Dead Code Removal and Barrel File Cleanup

**User Story:** As a developer, I want unused code removed and barrel files properly maintained, so that the codebase stays clean and navigable.

#### Acceptance Criteria

1. THE User_Controller SHALL either contain route handlers or be removed from the codebase along with its registration in User_Module
2. THE auth/dto/index.ts barrel file SHALL re-export SignInDto and SignUpDto, or be removed if the barrel pattern is not used for auth DTOs
3. THE load.config.ts SHALL remove the direct `import 'dotenv/config'` side-effect import since `@nestjs/config` with `ConfigModule.forRoot()` already handles dotenv loading
