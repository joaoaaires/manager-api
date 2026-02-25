# Design Document: Code Improvements

## Overview

This design covers a set of cross-cutting improvements to the manager-api NestJS 11 codebase. The changes span security (password hash exclusion), documentation (Swagger), architecture (DI-based config, global exception filter), quality (unit and e2e tests), data integrity (entity fixes), operations (CORS, health check), and maintainability (TypeScript strictness, dead code removal).

The improvements are largely independent and can be implemented in any order, though some have natural dependencies (e.g., Response DTOs must exist before Swagger decorators reference them, and DI config changes should land before unit tests that mock ConfigService).

### Key Design Decisions

1. **Response DTOs over destructuring** — Instead of `const { password, ...rest } = user`, we introduce explicit DTO classes (`SignUpResponseDto`, `SignInResponseDto`, `ProfileResponseDto`). This makes the API contract explicit, enables Swagger schema generation, and pairs with `@Exclude()` on the entity as defense-in-depth.

2. **Global ClassSerializerInterceptor** — Registered in `main.ts` via `app.useGlobalInterceptors()`. This ensures `@Exclude()` annotations on entities are enforced on every response, even if a developer forgets to use a Response DTO.

3. **ConfigService everywhere** — All direct imports of `envs` from `load.config.ts` are replaced with `ConfigService.get()` calls. This makes every service unit-testable by simply mocking `ConfigService`.

4. **Startup validation** — The `loadConfig` factory validates `SALT` (positive integer) and `SECRET` (non-empty string) at bootstrap time. If validation fails, the app throws before listening, producing a clear error message.

5. **Global HttpExceptionFilter** — A single filter catches all exceptions, logs them via NestJS `Logger`, and returns a consistent `{ statusCode, message, timestamp }` JSON shape. HTTP exceptions preserve their original status; non-HTTP exceptions become 500s.

6. **fast-check for property-based testing** — We use `fast-check` as the PBT library since it's the most mature JS/TS property-based testing library and integrates cleanly with Jest.

## Architecture

The improvements touch multiple layers but do not change the fundamental module structure. The diagram below shows the affected components and new additions:

```mermaid
graph TD
    subgraph Bootstrap["main.ts Bootstrap"]
        VP[ValidationPipe]
        CSI[ClassSerializerInterceptor]
        EF[HttpExceptionFilter]
        CORS[CORS Config]
        SW[Swagger Setup]
        LOG[NestJS Logger]
    end

    subgraph Config["Configuration"]
        LC[load.config.ts<br/>with validation]
        CM[ConfigModule.forRoot]
        CS[ConfigService]
    end

    subgraph Auth["Auth Module"]
        AS[AuthService]
        AG[AuthGuard]
        JM[JwtModule.registerAsync]
    end

    subgraph User["User Module"]
        US[UserService]
        UE[UserEntity<br/>@Exclude on password]
        UR[UserRepository]
    end

    subgraph DTOs["Response DTOs"]
        SUR[SignUpResponseDto]
        SIR[SignInResponseDto]
        PR[ProfileResponseDto]
    end

    subgraph Endpoints["Endpoints"]
        AC[AppController]
        HC[GET /health]
    end

    CM --> CS
    CS --> AG
    CS --> JM
    CS --> US
    CS --> SqliteConfigService

    AS --> SUR
    AS --> SIR
    AS --> PR
    AC --> AS
    AC --> HC

    EF --> LOG
    Bootstrap --> Auth
    Bootstrap --> User
```

### Changes by Layer

- **Bootstrap (`main.ts`)**: Add `ClassSerializerInterceptor`, `HttpExceptionFilter`, CORS enablement, NestJS `Logger`, improved Swagger config with Bearer auth.
- **Config (`load.config.ts`)**: Add startup validation for `SALT` and `SECRET`. Remove `import 'dotenv/config'`.
- **Config (`sqlite.config.service.ts`)**: Inject `ConfigService` instead of reading `process.env` directly.
- **Auth Module**: `JwtModule.registerAsync` with `ConfigService`. `AuthGuard` injects `ConfigService` for the secret. `AuthService` returns Response DTOs.
- **User Module**: `UserService` injects `ConfigService` for salt. `UserEntity` gets `@Exclude()` on password, `Date` types on timestamps, unique constraint on email. Remove empty `UserController`.
- **New files**: Response DTOs, `HttpExceptionFilter`, health endpoint (in `AppController`), unit test files, updated e2e tests.
- **tsconfig.json**: Enable `noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch`.

## Components and Interfaces

### Response DTOs

Three new DTO classes in `src/modules/auth/dto/`:

```typescript
// sign-up-response.dto.ts
export class SignUpResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() createAt: Date;
  @ApiProperty() updateAt: Date;
  @ApiProperty() token: string;
}

// sign-in-response.dto.ts
export class SignInResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() createAt: Date;
  @ApiProperty() updateAt: Date;
  @ApiProperty() token: string;
}

// profile-response.dto.ts
export class ProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() createAt: Date;
  @ApiProperty() updateAt: Date;
}
```

Since `SignUpResponseDto` and `SignInResponseDto` share the same shape, they could be a single class. However, keeping them separate allows independent evolution if the sign-up and sign-in responses diverge in the future. A shared base class (`AuthResponseDto`) with a `token` field is a reasonable alternative.

### HttpExceptionFilter

New file: `src/common/filters/http-exception.filter.ts`

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Health Endpoint

Added to `AppController` as a simple unauthenticated GET:

```typescript
@Get('health')
health() {
  return { status: 'ok' };
}
```

### Config Validation (load.config.ts)

```typescript
export const loadConfig = () => {
  const salt = Number(process.env.SALT);
  if (!Number.isInteger(salt) || salt <= 0) {
    throw new Error('SALT must be a valid positive integer');
  }

  const secret = process.env.SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('SECRET must be defined and non-empty');
  }

  return {
    port: Number(process.env.PORT) || 3000,
    databaseFileName: process.env.DATABASE_FILE_NAME || 'data.db',
    salt,
    secret,
  };
};
```

### AuthGuard with ConfigService

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ... extract token ...
    request.payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('secret'),
    });
    // ...
  }
}
```

### AuthModule with JwtModule.registerAsync

```typescript
JwtModule.registerAsync({
  global: true,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('secret'),
    signOptions: { expiresIn: '86400s' },
  }),
}),
```

### UserService with ConfigService

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // ...
    const salt = this.configService.get<number>('salt');
    const passwordCrypt = await bcrypt.hash(createUserDto.password, salt);
    // ...
  }
}
```

### SqliteConfigService with ConfigService

```typescript
@Injectable()
export class SqliteConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'sqlite',
      database: this.configService.get<string>('databaseFileName'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
    };
  }
}
```

### UserEntity Updates

```typescript
@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 100, nullable: false })
  name: string;

  @Column({ name: 'email', length: 70, nullable: false, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password', length: 255, nullable: false })
  password: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updateAt: Date;

  @DeleteDateColumn({ name: 'delete_at' })
  deleteAt: Date;
}
```

### Swagger Configuration (main.ts)

```typescript
const config = new DocumentBuilder()
  .setTitle('Manager API')
  .setDescription('REST API for user management with JWT authentication')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
```

Endpoints decorated with:
- `@ApiBearerAuth()` on protected routes
- `@ApiBody()`, `@ApiResponse()`, `@ApiConflictResponse()`, `@ApiUnauthorizedResponse()` as appropriate
- `@ApiProperty()` on all DTO fields

### Barrel File and Dead Code Cleanup

- `src/modules/auth/dto/index.ts`: Re-export `SignInDto`, `SignUpDto`, and all response DTOs.
- `src/modules/user/user.controller.ts`: Remove file. Remove `UserController` from `UserModule` controllers array.
- `src/config/load.config.ts`: Remove `import 'dotenv/config'` line.

### TypeScript Config Changes

```jsonc
// tsconfig.json changes
{
  "noImplicitAny": true,
  "strictBindCallApply": true,
  "noFallthroughCasesInSwitch": true
}
```

Any resulting type errors must be fixed (e.g., adding explicit types to parameters that relied on implicit `any`).

## Data Models

### UserEntity (updated)

| Field | Type | DB Column | Constraints | Notes |
|-------|------|-----------|-------------|-------|
| id | `string` | `id` (PK) | UUID, auto-generated | No change |
| name | `string` | `name` | NOT NULL, max 100 | No change |
| email | `string` | `email` | NOT NULL, max 70, UNIQUE | Added unique constraint |
| password | `string` | `password` | NOT NULL, max 255 | Added `@Exclude()` |
| createAt | `Date` | `create_at` | Auto-set on insert | Changed from `string` to `Date` |
| updateAt | `Date` | `update_at` | Auto-set on update | Changed from `string` to `Date` |
| deleteAt | `Date` | `delete_at` | Nullable, soft-delete | Changed from `string` to `Date` |

### Response DTOs

| DTO | Fields | Used By |
|-----|--------|---------|
| SignUpResponseDto | id, name, email, createAt, updateAt, token | `AuthService.register()` |
| SignInResponseDto | id, name, email, createAt, updateAt, token | `AuthService.access()` |
| ProfileResponseDto | id, name, email, createAt, updateAt | `AuthService.profile()` |

### Exception Filter Response Shape

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auth endpoint responses contain only allowed fields

*For any* valid user entity returned by the database, when `AuthService.register()` or `AuthService.access()` produces a response, the response object SHALL contain exactly the keys `id`, `name`, `email`, `createAt`, `updateAt`, and `token` — and no `password` field. When `AuthService.profile()` produces a response, the response object SHALL contain exactly the keys `id`, `name`, `email`, `createAt`, and `updateAt` — and no `password` or `token` field.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: SALT validation rejects non-positive-integer values

*For any* string value of the `SALT` environment variable that is not a valid positive integer (e.g., negative numbers, zero, floats, non-numeric strings, empty string, undefined), the `loadConfig` function SHALL throw an error containing a descriptive message.

**Validates: Requirements 3.5**

### Property 3: SECRET validation rejects missing or empty values

*For any* value of the `SECRET` environment variable that is undefined, empty, or composed entirely of whitespace, the `loadConfig` function SHALL throw an error containing a descriptive message.

**Validates: Requirements 3.6**

### Property 4: Exception filter produces consistent responses with correct status codes

*For any* exception passed to the `HttpExceptionFilter`, the JSON response SHALL contain `statusCode`, `message`, and `timestamp` fields. If the exception is an `HttpException`, the `statusCode` SHALL equal the exception's original status code and the `message` SHALL equal the exception's message. If the exception is not an `HttpException`, the `statusCode` SHALL be 500 and the `message` SHALL be `'Internal server error'`.

**Validates: Requirements 4.1, 4.4, 4.5**

### Property 5: User entity timestamps are Date instances

*For any* `UserEntity` created and saved through the repository, the `createAt` and `updateAt` fields SHALL be instances of `Date` (not strings), and SHALL represent valid date values (i.e., `getTime()` returns a finite number).

**Validates: Requirements 7.1, 7.3**

### Property 6: Duplicate email insert is rejected

*For any* email string, if a user with that email already exists in the repository, attempting to create a second user with the same email SHALL result in an `EmailAlreadyExistsException` being thrown, and the total number of users in the repository SHALL remain unchanged.

**Validates: Requirements 7.2**

## Error Handling

### Global Exception Filter (`HttpExceptionFilter`)

All unhandled exceptions are caught by the global filter registered in `main.ts`:

| Exception Type | Status Code | Message | Logging |
|---|---|---|---|
| `HttpException` (and subclasses) | Original status from exception | Original message from exception | `Logger.error` with method, URL, status, message, stack |
| Non-HTTP `Error` | 500 | `'Internal server error'` | `Logger.error` with method, URL, 500, message, stack |
| Unknown throw | 500 | `'Internal server error'` | `Logger.error` with method, URL, 500, no stack |

### Domain Exceptions (unchanged)

| Exception | HTTP Status | Message | Thrown By |
|---|---|---|---|
| `EmailAlreadyExistsException` | 409 Conflict | `'E-mail já existe.'` | `UserService.create()` |
| `UserNotFoundException` | 404 Not Found | `'Usuário não encontrado!'` | `UserService.readOneByEmail()` |
| `UserUnauthorizedException` | 401 Unauthorized | `'E-mail e/ou senha inválidos!'` | `AuthService.access()` |

### Validation Errors

The global `ValidationPipe` continues to handle DTO validation. Invalid input returns 400 Bad Request with class-validator messages (in Portuguese).

### Config Startup Validation

| Condition | Behavior |
|---|---|
| `SALT` is not a valid positive integer | `loadConfig` throws `Error('SALT must be a valid positive integer')` — app fails to start |
| `SECRET` is undefined or empty/whitespace | `loadConfig` throws `Error('SECRET must be defined and non-empty')` — app fails to start |

These errors surface during `ConfigModule.forRoot()` initialization, before the HTTP server starts listening.

## Testing Strategy

### Dual Testing Approach

This feature uses both unit tests and property-based tests:

- **Unit tests** (Jest): Verify specific examples, edge cases, integration points, and mock interactions. Cover service methods, guard behavior, e2e flows, and Swagger output.
- **Property-based tests** (fast-check + Jest): Verify universal properties across randomly generated inputs. Each property test maps to a Correctness Property from this design document.

Both are complementary — unit tests catch concrete bugs in specific scenarios, property tests verify general correctness across the input space.

### Property-Based Testing Configuration

- **Library**: `fast-check` (install via `yarn add -D fast-check`)
- **Minimum iterations**: 100 per property test (configured via `fc.assert(..., { numRuns: 100 })`)
- **Each property test MUST be tagged** with a comment referencing the design property:
  ```
  // Feature: code-improvements, Property 1: Auth endpoint responses contain only allowed fields
  ```
- **Each correctness property is implemented by a single property-based test**

### Unit Test Plan

| Test File | Covers | Key Cases |
|---|---|---|
| `auth.service.spec.ts` | `AuthService` | `register()` returns correct DTO shape without password; `access()` returns correct DTO shape; `access()` throws on wrong password; `profile()` returns correct DTO shape without password or token |
| `user.service.spec.ts` | `UserService` | `create()` hashes password and saves; `create()` throws `EmailAlreadyExistsException` on duplicate; `readOneByEmail()` returns user; `readOneByEmail()` throws `UserNotFoundException` |
| `auth.guard.spec.ts` | `AuthGuard` | Extracts Bearer token; rejects missing token (401); rejects invalid token (401); sets payload on valid token |
| `http-exception.filter.spec.ts` | `HttpExceptionFilter` | HTTP exception preserves status/message; non-HTTP exception returns 500; response contains timestamp; logger is called |
| `load.config.spec.ts` | `loadConfig` | Valid config returns object; invalid SALT throws; missing SECRET throws |

### Property Test Plan

| Test File | Property | Description |
|---|---|---|
| `auth.service.spec.ts` | Property 1 | Generate random user entities, verify response DTO keys |
| `load.config.spec.ts` | Property 2 | Generate random non-positive-integer strings, verify throw |
| `load.config.spec.ts` | Property 3 | Generate random empty/whitespace strings, verify throw |
| `http-exception.filter.spec.ts` | Property 4 | Generate random HttpExceptions and Errors, verify response shape and status |
| `user.entity.spec.ts` | Property 5 | Create user entities via repository, verify Date types |
| `user.service.spec.ts` | Property 6 | Generate random emails, verify duplicate insert throws |

### E2E Test Plan

| Test File | Endpoint | Key Cases |
|---|---|---|
| `test/app.e2e-spec.ts` | `POST /sign-up` | 201 with correct response body (id, name, email, token, no password) |
| `test/app.e2e-spec.ts` | `POST /sign-in` | 201 with token; 401 on bad credentials |
| `test/app.e2e-spec.ts` | `GET /profile` | 200 with user data (no password); 401 without token |
| `test/app.e2e-spec.ts` | `GET /health` | 200 with `{ status: 'ok' }`, no auth required |

The e2e test suite uses an isolated temporary SQLite database (`:memory:` or a temp file cleaned up in `afterAll`) to avoid affecting production data. The test module overrides `TypeOrmModule` config to point to the isolated database.
