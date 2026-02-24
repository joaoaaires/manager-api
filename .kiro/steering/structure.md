# Project Structure

```
src/
├── main.ts                          # Bootstrap, global pipes, Swagger setup
├── app.module.ts                    # Root module (config, TypeORM, feature modules)
├── app.controller.ts                # Top-level routes (sign-up, sign-in, profile)
├── config/
│   ├── load.config.ts               # Env vars loader (exported as default + named)
│   └── sqlite.config.service.ts     # TypeORM options factory for SQLite
├── database/
│   ├── data-source.ts               # Standalone DataSource for CLI migrations
│   └── migrations/                  # TypeORM migration files
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.guard.ts            # JWT bearer guard (CanActivate)
    │   ├── dto/                     # SignInDto, SignUpDto
    │   ├── errors/                  # Custom exceptions
    │   └── interfaces/              # JwtPayload, AuthGuardRequest
    └── user/
        ├── user.module.ts
        ├── user.service.ts
        ├── user.repository.ts       # Extends TypeORM Repository<UserEntity>
        ├── user.controller.ts
        ├── dto/                     # CreateUserDto
        ├── entities/                # UserEntity (TypeORM)
        └── errors/                  # Custom exceptions
```

## Conventions

- Each domain lives under `src/modules/<domain>/` as a self-contained NestJS module.
- Modules expose: module, service, controller, repository, plus sub-folders for dto, entities, errors, and interfaces.
- Barrel files (`index.ts`) re-export from sub-folders (dto, errors).
- Custom exceptions extend NestJS built-in HTTP exceptions.
- Repository classes extend TypeORM `Repository<Entity>` and are injected via `@InjectRepository`.
- Entities use TypeORM decorators with explicit column names (snake_case in DB, camelCase in code).
- Entities include `createAt`, `updateAt`, `deleteAt` timestamp columns (soft-delete pattern).
- DTOs use `class-validator` decorators for input validation; validation messages are in Portuguese.
- Global `ValidationPipe` is configured with `transform`, `whitelist`, and `forbidNonWhitelisted`.
- Auth uses Bearer JWT tokens extracted from the Authorization header.
- Config is loaded once via `@nestjs/config` (global) and also imported directly from `load.config.ts` in some places.
- Migrations are generated and run via the TypeORM CLI using the standalone `data-source.ts`.
- Unit test files are co-located with source (`*.spec.ts`); e2e tests live in `test/`.
