## Why

The API is meant to run on the local `cleitin-server` (`192.168.100.180`), which already hosts a MariaDB 11.8 instance and has no PostgreSQL. Keeping Postgres would mean installing and tuning a second database engine on a ~1 GB RAM ARM box, so the API must target MariaDB instead.

## What Changes

- **BREAKING**: Switch the Prisma datasource provider from `postgresql` to `mysql` (Prisma's MariaDB-compatible provider).
- **BREAKING**: Replace the Postgres driver adapter (`@prisma/adapter-pg` + `pg`) with the MariaDB driver adapter (`@prisma/adapter-mariadb` + `mariadb`) in the Prisma service.
- **BREAKING**: Discard the existing Postgres migration history and generate a fresh baseline migration for MariaDB (`migration_lock.toml` provider becomes `mysql`).
- `DATABASE_URL` / `DIRECT_URL` now use `mysql://user:password@host:3306/database` and point to a dedicated `manager` database on `cleitin-server`.
- Create a local `.env` (git-ignored) with the `cleitin-server` connection settings; update `.env.example` and the config test fixtures to the MariaDB URL format.
- User email uniqueness becomes case-insensitive (MariaDB `utf8mb4_unicode_ci` collation), so `A@x.com` and `a@x.com` now conflict.
- Optional one-off copy of existing `User` rows from Postgres to MariaDB, if there is data worth keeping.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `config-validation`: `DATABASE_URL` must be a MySQL/MariaDB connection URL (`mysql://` or `mariadb://`); other schemes are rejected at startup.
- `user-account-integrity`: email uniqueness is enforced case-insensitively by the database.

## Impact

- **Code**: `prisma/schema.prisma`, `prisma/migrations/**`, `src/database/prisma.service.ts`, `src/config/load.validation.ts`, `src/config/load.validation.spec.ts`, `.env.example`, `README.md`.
- **Dependencies**: remove `@prisma/adapter-pg`, `pg`, `@types/pg`; add `@prisma/adapter-mariadb`, `mariadb`.
- **Infrastructure**: a `manager` database and a `manager` application user must be created on `cleitin-server` by `root` (the `claude` user cannot grant privileges).
- **Operations**: `postinstall` runs `prisma migrate deploy`, so installs will fail until `.env` points to a reachable MariaDB with the new baseline migration.
- **Data**: existing Postgres data is not migrated automatically.
