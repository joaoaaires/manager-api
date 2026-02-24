# Tech Stack

- Runtime: Node.js
- Language: TypeScript (ES2023 target, nodenext modules)
- Framework: NestJS 11
- ORM: TypeORM 0.3 with SQLite (sqlite3)
- Auth: @nestjs/jwt, bcrypt
- Validation: class-validator, class-transformer
- API Docs: @nestjs/swagger
- Config: @nestjs/config + dotenv
- Package Manager: Yarn

## Dev Tooling

- Linting: ESLint 9 (flat config) + typescript-eslint + eslint-plugin-prettier
- Formatting: Prettier (single quotes, trailing commas)
- Testing: Jest 30 + ts-jest (unit), supertest (e2e)
- Build: NestJS CLI (`nest build`)

## Common Commands

| Action | Command |
|---|---|
| Install deps | `yarn` |
| Dev server | `yarn start:dev` |
| Build | `yarn build` |
| Start (prod) | `yarn start:prod` |
| Lint (autofix) | `yarn lint` |
| Format | `yarn format` |
| Unit tests | `yarn test` |
| E2E tests | `yarn test:e2e` |
| Test coverage | `yarn test:cov` |
| Generate migration | `yarn migration:generate src/database/migrations/<MigrationName>` |
| Run migrations | `yarn migration:run` |

## Environment Variables (.env)

| Variable | Purpose |
|---|---|
| PORT | HTTP listen port (default 3000) |
| DATABASE_FILE_NAME | SQLite database file path |
| SALT | bcrypt hash rounds |
| SECRET | JWT signing secret |
