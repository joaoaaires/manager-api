# Project Structure

```
src/
├── main.ts                          # App bootstrap, global pipes, Swagger setup
├── app.module.ts                    # Root module (ConfigModule, PrismaModule, AuthModule, HealthModule)
├── config/
│   ├── load.config.ts               # Config factory (reads env vars)
│   └── load.validation.ts           # Env validation at startup
├── generated/prisma/                # Auto-generated Prisma client (gitignored)
└── modules/
    ├── auth/                        # Authentication module
    ├── health/                      # Health check module (@nestjs/terminus)
    ├── prisma/                      # Global Prisma module & service
    └── user/                        # User domain module
prisma/
├── schema.prisma                    # Prisma schema (models, generator, datasource)
└── migrations/                      # SQL migration files
test/                                # E2e tests
```

## Module Conventions

Each domain module under `src/modules/<name>/` follows this layout:

- `<name>.module.ts` — NestJS module definition
- `<name>.controller.ts` — Route handlers (if the module exposes endpoints)
- `<name>.service.ts` — Business logic
- `dto/` — Data Transfer Objects with `class-validator` decorators and `@ApiProperty`
  - `index.ts` barrel file re-exports all DTOs
  - Input DTOs: validation decorators (`@IsEmail`, `@IsNotEmpty`, `@MinLength`, etc.)
  - Response DTOs: `@Expose()` fields + static `fromEntity()` factory using `plainToInstance`
- `errors/` — Custom exception classes extending NestJS HTTP exceptions
  - `index.ts` barrel file re-exports all exceptions
- `interfaces/` — TypeScript interfaces (used in auth for JWT payload, authenticated request)

## Key Patterns

- PrismaModule is `@Global()` — PrismaService is injectable everywhere without importing the module
- ConfigModule is global — ConfigService is injectable everywhere
- Response DTOs use `class-transformer` with `excludeExtraneousValues: true` to strip sensitive fields (e.g., password)
- Custom exceptions wrap NestJS built-in exceptions (`NotFoundException`, `ConflictException`, `UnauthorizedException`) with pt-BR messages
- Auth guard (`AuthGuard`) wraps Passport's JWT guard
- Barrel `index.ts` files are used in `dto/` and `errors/` directories for clean imports
