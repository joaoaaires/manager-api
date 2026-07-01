### Requirement: Auth service interface with symbolic token
The auth module SHALL define an `IAuthService` interface and an `AUTH_SERVICE` Symbol token in `src/modules/auth/services/auth.service.interface.ts`. The interface SHALL expose `register(dto: SignUpDto): Promise<AuthResponseDto>` and `access(dto: SignInDto): Promise<AuthResponseDto>`.

#### Scenario: AuthService resolves via token injection
- **WHEN** `AuthModule` provides `{ provide: AUTH_SERVICE, useClass: AuthService }`
- **THEN** any component injecting `@Inject(AUTH_SERVICE)` receives an `IAuthService` instance

### Requirement: Auth service moved to services/ subfolder
The `AuthService` class SHALL be located at `src/modules/auth/services/auth.service.ts` and SHALL implement `IAuthService`. The file `src/modules/auth/auth.service.ts` SHALL be removed.

#### Scenario: AuthModule registers AuthService from services/ path
- **WHEN** `AuthModule` is compiled
- **THEN** it imports `AuthService` from `./services/auth.service` (not from `./auth.service`)

### Requirement: Auth service depends on IUserService, not UserService
`AuthService` SHALL inject `IUserService` via `@Inject(USER_SERVICE)` instead of depending on the concrete `UserService` class. It SHALL call `createUser()` and `getUserByEmail()` as defined by `IUserService`.

#### Scenario: Register delegates to IUserService.createUser
- **WHEN** `AuthService.register(signUpDto)` is called
- **THEN** it calls `this.userService.createUser(signUpDto)` on the injected `IUserService`

#### Scenario: Access delegates to IUserService.getUserByEmail
- **WHEN** `AuthService.access(signInDto)` is called
- **THEN** it calls `this.userService.getUserByEmail(signInDto.email)` on the injected `IUserService`

### Requirement: Auth controller moved to controllers/ subfolder
The `AuthController` class SHALL be located at `src/modules/auth/controllers/auth.controller.ts`. The file `src/modules/auth/auth.controller.ts` SHALL be removed.

#### Scenario: AuthModule registers AuthController from controllers/ path
- **WHEN** `AuthModule` is compiled
- **THEN** it imports `AuthController` from `./controllers/auth.controller`

### Requirement: Auth DTOs organized in request/ and response/ subfolders
Sign-up and sign-in request DTOs SHALL reside in `src/modules/auth/dto/request/`. The auth response DTO SHALL reside in `src/modules/auth/dto/response/`. The barrel `src/modules/auth/dto/index.ts` SHALL re-export all DTOs from the new paths. Legacy flat DTO files in `dto/` root SHALL be removed.

#### Scenario: Imports via barrel still resolve
- **WHEN** `AuthController` imports `{ SignUpDto, SignInDto, AuthResponseDto }` from `'../dto'`
- **THEN** TypeScript resolves all three types without error

### Requirement: AuthModule provides AuthService via symbolic token
`AuthModule` SHALL register `AuthService` with `{ provide: AUTH_SERVICE, useClass: AuthService }` instead of as a plain provider.

#### Scenario: AuthModule compiles and wires correctly
- **WHEN** `AuthModule` is bootstrapped
- **THEN** `AuthController` receives an `IAuthService` injected via `AUTH_SERVICE` token
