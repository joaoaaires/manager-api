# Tech Stack

## Core
- Runtime: Node.js (ES2023 target)
- Language: TypeScript 5.x (strict null checks enabled, `noImplicitAny` off)
- Framework: NestJS 11
- Package manager: Yarn

## Database & ORM
- Database: PostgreSQL
- ORM: Prisma 7 with `@prisma/adapter-pg` driver adapter
- Prisma client output: `src/generated/prisma/` (gitignored, regenerated on install)
- Migrations: `prisma/migrations/`

## Authentication
- Passport.js with `passport-jwt` strategy
- `@nestjs/jwt` for token signing/verification
- `bcrypt` for password hashing

## API Documentation
- `@nestjs/swagger` — Swagger UI at `/docs`

## Validation
- `class-validator` for DTO validation decorators
- `class-transformer` for response serialization (`plainToInstance` with `excludeExtraneousValues`)
- Global `ValidationPipe` with `transform`, `whitelist`, and `forbidNonWhitelisted`

## Testing
- Jest (unit tests: `src/**/*.spec.ts`)
- Supertest for e2e tests (`test/**/*.e2e-spec.ts`)
- ts-jest transform

## Linting & Formatting
- ESLint 9 flat config with `typescript-eslint` and `eslint-plugin-prettier`
- Prettier: single quotes, trailing commas (`all`)

## Common Commands

```bash
# Development
yarn start:dev          # Start with watch mode

# Build & Production
yarn build              # Compile with nest build
yarn start:prod         # Run compiled output (node dist/main)

# Database
yarn db:migrate:dev     # Create/apply dev migration
yarn db:migrate:prod    # Apply migrations in production
yarn db:migrate:reset   # Reset database and re-apply migrations

# Testing
yarn test               # Run unit tests
yarn test:e2e           # Run e2e tests
yarn test:cov           # Run tests with coverage

# Code Quality
yarn lint               # ESLint with auto-fix
yarn format             # Prettier format
```

## Environment Variables

Required (validated at startup via `loadValidation`):
- `PORT` — Server port
- `DATABASE_URL` — PostgreSQL connection string
- `SALT` — bcrypt salt rounds
- `SECRET` — JWT signing secret
- `JWT_EXPIRES_IN` — Token expiry in seconds
- `JWT_ISSUER` — JWT issuer claim
- `JWT_AUDIENCE` — JWT audience claim

Prisma migrations use `DIRECT_URL` from env (configured in `prisma.config.ts`).
