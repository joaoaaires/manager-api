## 1. Database provisioning (cleitin-server, as root)

- [x] 1.1 Create databases `manager` and `manager_shadow` with `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
- [x] 1.2 Create user `manager`@`192.168.100.%` and `manager`@`localhost` with a random password; grant `ALL PRIVILEGES` on `manager.*` and `manager_shadow.*`
- [x] 1.3 Grant `ALL PRIVILEGES ON manager.*` to `claude`@`localhost` and `claude`@`192.168.100.%`
- [x] 1.4 Verify from the Mac: `mariadb -h 192.168.100.180 -u manager -p manager -e 'SELECT 1'`
- [x] 1.5 Put the real password in `.env` (`DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`)
- [x] 1.6 Document the `manager` database and user in `cleitin-server/README.md` (Banco de dados section)

## 2. Dependencies

- [x] 2.1 Remove `@prisma/adapter-pg`, `pg`, `@types/pg`
- [x] 2.2 Add `@prisma/adapter-mariadb` and `mariadb` (same major as `@prisma/client`)

## 3. Prisma schema and migrations

- [x] 3.1 Change `datasource db` provider to `mysql` in `prisma/schema.prisma`
- [x] 3.2 Add `shadowDatabaseUrl: process.env['SHADOW_DATABASE_URL']` to `prisma.config.ts` datasource
- [x] 3.3 Delete `prisma/migrations/` (Postgres migration and `migration_lock.toml`)
- [x] 3.4 Run `yarn prisma migrate dev --name init` and commit the generated MariaDB migration
- [x] 3.5 Run `yarn prisma generate` and check the `User` table in `manager` (`SHOW CREATE TABLE User`)

## 4. Application code

- [x] 4.1 Rewrite `src/database/prisma.service.ts` to parse `databaseUrl` and build `PrismaMariaDb({ host, port, user, password, database, connectionLimit: 5 })`
- [x] 4.2 Restrict `DATABASE_URL` in `src/config/load.validation.ts` to `mysql://` / `mariadb://` URLs
- [x] 4.3 Update `src/config/load.validation.spec.ts` fixtures to `mysql://` URLs and add a test rejecting a `postgres://` URL
- [x] 4.4 Verify against the real MariaDB that creating a user with a case variant of an existing email returns 409 (collation behavior; a mocked unit test cannot prove it — covered by 7.3)

## 5. Config and docs

- [x] 5.1 Update `.env.example` with `mysql://` placeholders for `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`
- [x] 5.2 Update `README.md`: MariaDB on `cleitin-server`, env vars, migration commands, `postinstall` requiring a reachable database

## 6. Data copy (not needed: old Postgres had no data)

- [x] 6.1 Export `User` rows from Postgres as CSV (`\copy "User" TO 'users.csv' CSV HEADER`)
- [x] 6.2 Import into `manager.User` with `LOAD DATA LOCAL INFILE` (or a short script) and compare row counts
- [x] 6.3 Check for emails that collide case-insensitively before importing

## 7. Verification

- [x] 7.1 `yarn lint`, `yarn build`, `yarn test` pass (fixed pre-existing unused `UnauthorizedException` import in `auth.strategy.ts`)
- [x] 7.2 `yarn start:dev` connects to MariaDB; health check is green
- [x] 7.3 Manual flow: sign-up, sign-in, `GET /profile`, duplicate email (same case and different case) returns 409 (also restored bcrypt hashing on sign-up in `AuthService.register`, missing since commit 594441a)
- [x] 7.4 `grep -ri "postgres\|adapter-pg" src prisma package.json .env.example` returns nothing (only the intentional rejection test in `load.validation.spec.ts`)
