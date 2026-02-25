# Implementation Plan: Code Improvements

## Overview

Incremental improvements to the manager-api NestJS 11 codebase covering security (password hash exclusion via Response DTOs), Swagger documentation, DI-based configuration with startup validation, global exception filter with logging, unit and property-based tests, e2e test fixes, entity data integrity, CORS/health check, TypeScript strictness, and dead code removal. Each task builds on the previous, ending with full wiring and test validation.

## Tasks

- [x] 1. Configuration and validation improvements
  - [x] 1.1 Update `src/config/load.config.ts` to add startup validation for SALT and SECRET, and remove the `import 'dotenv/config'` side-effect import
    - Validate SALT is a positive integer, throw descriptive error if not
    - Validate SECRET is defined and non-empty, throw descriptive error if not
    - Remove direct `import 'dotenv/config'` since ConfigModule.forRoot() handles dotenv
    - Export the `loadConfig` factory function for use with ConfigModule
    - _Requirements: 3.5, 3.6, 10.3_

  - [ ]* 1.2 Write property tests for SALT validation (Property 2)
    - **Property 2: SALT validation rejects non-positive-integer values**
    - Use fast-check to generate random non-positive-integer strings (negatives, zero, floats, non-numeric, empty, undefined)
    - Verify `loadConfig` throws an error with descriptive message for each
    - **Validates: Requirement 3.5**

  - [ ]* 1.3 Write property tests for SECRET validation (Property 3)
    - **Property 3: SECRET validation rejects missing or empty values**
    - Use fast-check to generate undefined, empty, and whitespace-only strings
    - Verify `loadConfig` throws an error with descriptive message for each
    - **Validates: Requirement 3.6**

  - [x] 1.4 Refactor `src/config/sqlite.config.service.ts` to inject ConfigService instead of reading `process.env` directly
    - Inject `ConfigService` via constructor
    - Use `configService.get<string>('databaseFileName')` for the database path
    - _Requirements: 3.4_

  - [x] 1.5 Refactor `src/modules/auth/auth.guard.ts` to inject ConfigService for the JWT secret
    - Add `ConfigService` to constructor injection
    - Replace direct `envs` import with `configService.get<string>('secret')`
    - _Requirements: 3.1_

  - [x] 1.6 Refactor `src/modules/auth/auth.module.ts` to use `JwtModule.registerAsync` with ConfigService
    - Replace `JwtModule.register()` with `JwtModule.registerAsync()` using `ConfigService`
    - Inject ConfigService via `useFactory` to provide secret and signOptions
    - _Requirements: 3.2_

  - [x] 1.7 Refactor `src/modules/user/user.service.ts` to inject ConfigService for bcrypt salt rounds
    - Add `ConfigService` to constructor injection
    - Replace direct `envs` import with `configService.get<number>('salt')`
    - _Requirements: 3.3_

- [x] 2. Checkpoint - Ensure the app compiles and all existing tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. User entity and response DTO improvements
  - [x] 3.1 Update `src/modules/user/entities/user.entity.ts` with `@Exclude()`, Date types, and unique email constraint
    - Add `@Exclude()` from class-transformer on the password column
    - Change `createAt`, `updateAt`, `deleteAt` types from `string` to `Date`
    - Add `unique: true` to the email column definition
    - _Requirements: 1.5, 7.1, 7.2_

  - [x] 3.2 Create Response DTOs in `src/modules/auth/dto/`
    - Create `sign-up-response.dto.ts` with fields: id, name, email, createAt, updateAt, token (all with `@ApiProperty()`)
    - Create `sign-in-response.dto.ts` with fields: id, name, email, createAt, updateAt, token (all with `@ApiProperty()`)
    - Create `profile-response.dto.ts` with fields: id, name, email, createAt, updateAt (all with `@ApiProperty()`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.7_

  - [x] 3.3 Update `src/modules/auth/dto/index.ts` barrel file to re-export all DTOs
    - Re-export SignInDto, SignUpDto, and all three new Response DTOs
    - _Requirements: 10.2_

  - [x] 3.4 Refactor `src/modules/auth/auth.service.ts` to return Response DTOs instead of destructured entities
    - Update `register()` to construct and return `SignUpResponseDto`
    - Update `access()` to construct and return `SignInResponseDto`
    - Update `profile()` to construct and return `ProfileResponseDto`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 3.5 Write property test for auth endpoint response fields (Property 1)
    - **Property 1: Auth endpoint responses contain only allowed fields**
    - Use fast-check to generate random user entity data
    - Verify register/access responses contain exactly id, name, email, createAt, updateAt, token and no password
    - Verify profile responses contain exactly id, name, email, createAt, updateAt and no password or token
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 4. Global interceptors, filters, and bootstrap improvements
  - [x] 4.1 Create `src/common/filters/http-exception.filter.ts` implementing the global exception filter
    - Implement `@Catch()` ExceptionFilter that catches all exceptions
    - For HttpException: preserve original status code and message
    - For non-HTTP exceptions: return 500 with 'Internal server error'
    - Log error details (method, URL, status, message, stack) via NestJS Logger
    - Return consistent JSON: `{ statusCode, message, timestamp }`
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ]* 4.2 Write property test for exception filter (Property 4)
    - **Property 4: Exception filter produces consistent responses with correct status codes**
    - Use fast-check to generate random HttpExceptions (various status codes/messages) and plain Errors
    - Verify response always contains statusCode, message, timestamp
    - Verify HttpException preserves original status; non-HTTP returns 500
    - **Validates: Requirements 4.1, 4.4, 4.5**

  - [x] 4.3 Update `src/main.ts` bootstrap with ClassSerializerInterceptor, HttpExceptionFilter, CORS, Logger, and improved Swagger config
    - Register `ClassSerializerInterceptor` globally via `app.useGlobalInterceptors()`
    - Register `HttpExceptionFilter` globally via `app.useGlobalFilters()`
    - Enable CORS with `app.enableCors()`
    - Replace `console.log` with NestJS `Logger` for startup messages
    - Update Swagger DocumentBuilder with title "Manager API", description, and `addBearerAuth()`
    - _Requirements: 1.6, 2.1, 2.2, 4.3, 8.1_

- [x] 5. Swagger decorators and health endpoint
  - [x] 5.1 Add `@ApiProperty()` decorators to existing DTOs (`CreateUserDto`, `SignInDto`)
    - Annotate each field with `@ApiProperty()` including description and type info
    - _Requirements: 2.6_

  - [x] 5.2 Add Swagger decorators to `src/app.controller.ts` endpoints and add health endpoint
    - Add `GET /health` endpoint returning `{ status: 'ok' }` without auth
    - Add `@ApiBearerAuth()` on protected profile route
    - Add `@ApiBody()`, `@ApiResponse()`, `@ApiConflictResponse()`, `@ApiUnauthorizedResponse()` to sign-up, sign-in, profile endpoints
    - _Requirements: 2.3, 2.4, 2.5, 8.2, 8.3_

- [x] 6. TypeScript strictness and dead code removal
  - [x] 6.1 Enable stricter TypeScript compiler options in `tsconfig.json`
    - Set `noImplicitAny: true`
    - Set `strictBindCallApply: true`
    - Set `noFallthroughCasesInSwitch: true`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 6.2 Fix any type errors introduced by stricter compiler options
    - Add explicit types to parameters that relied on implicit `any`
    - Ensure the codebase compiles cleanly with the new settings
    - _Requirements: 9.4_

  - [x] 6.3 Remove empty `UserController` and clean up `UserModule`
    - Delete `src/modules/user/user.controller.ts`
    - Remove `UserController` from the `controllers` array in `UserModule`
    - _Requirements: 10.1_

- [x] 7. Checkpoint - Ensure the app compiles and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Unit tests for services and guards
  - [x]* 8.1 Write unit tests for `AuthService` in `src/modules/auth/auth.service.spec.ts`
    - Test `register()` returns correct DTO shape without password field
    - Test `access()` returns correct DTO shape with token
    - Test `access()` throws on wrong password
    - Test `profile()` returns correct DTO shape without password or token
    - Mock UserService and JwtService dependencies
    - _Requirements: 5.1, 5.4_

  - [x]* 8.2 Write unit tests for `UserService` in `src/modules/user/user.service.spec.ts`
    - Test `create()` hashes password and saves user
    - Test `create()` throws `EmailAlreadyExistsException` on duplicate email
    - Test `readOneByEmail()` returns user when found
    - Test `readOneByEmail()` throws `UserNotFoundException` when not found
    - Mock UserRepository and ConfigService
    - _Requirements: 5.2, 5.5, 5.6_

  - [x]* 8.3 Write unit tests for `AuthGuard` in `src/modules/auth/auth.guard.spec.ts`
    - Test Bearer token extraction from Authorization header
    - Test successful validation sets payload on request
    - Test rejection of missing token (throws 401)
    - Test rejection of invalid token (throws 401)
    - Mock JwtService and ConfigService
    - _Requirements: 5.3_

  - [x]* 8.4 Write unit tests for `HttpExceptionFilter` in `src/common/filters/http-exception.filter.spec.ts`
    - Test HTTP exception preserves status and message
    - Test non-HTTP exception returns 500 with generic message
    - Test response always contains timestamp field
    - Test logger is called with error details
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x]* 8.5 Write unit tests for `loadConfig` in `src/config/load.config.spec.ts`
    - Test valid config returns correct object with port, databaseFileName, salt, secret
    - Test invalid SALT throws descriptive error
    - Test missing SECRET throws descriptive error
    - _Requirements: 3.5, 3.6_

- [-] 9. E2E test suite
  - [ ]* 9.1 Fix and update `test/app.e2e-spec.ts` with isolated SQLite database and full endpoint coverage
    - Configure test module with in-memory or temporary SQLite database
    - Test POST /sign-up: 201 with response body containing id, name, email, token (no password)
    - Test POST /sign-in: 201 with token in response
    - Test GET /profile: 200 with user data (no password), 401 without token
    - Test GET /health: 200 with `{ status: 'ok' }`, no auth required
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check (install via `yarn add -D fast-check`)
- Unit tests use Jest 30 with ts-jest and mocked dependencies
- E2E tests use supertest with an isolated SQLite database
