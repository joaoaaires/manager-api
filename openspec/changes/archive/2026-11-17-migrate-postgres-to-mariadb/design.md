## Context

See proposal.md for motivation. Current state:

- Prisma 7 with the `prisma-client` generator and a driver adapter: `PrismaService` builds `new PrismaPg({ connectionString })` from `databaseUrl`.
- `prisma.config.ts` uses `DIRECT_URL` for the CLI (migrations); the app uses `DATABASE_URL`.
- One model (`User`) and one Postgres migration (`20260701024650_create_table_user`).
- Target: MariaDB `11.8.6` on `cleitin-server` (`192.168.100.180:3306`), bound to the LAN, no firewall, `max_connections = 30`, `innodb_buffer_pool_size = 64M`. Databases default to `utf8mb4` / `utf8mb4_unicode_ci`. Existing databases: `rsf`, `core` (reserved for core-api). New databases are not reachable by the `claude` user until `root` grants it.

## Goals / Non-Goals

**Goals:**
- The API connects to MariaDB via Prisma's MariaDB driver adapter, with no Postgres code or dependencies left.
- A clean MariaDB baseline migration that `prisma migrate deploy` applies on an empty `manager` database.
- A dedicated database and least-privilege user for this API.

**Non-Goals:**
- Running MariaDB locally (Docker etc.); development points at `cleitin-server` over the LAN.
- Automated, repeatable Postgres → MariaDB data migration tooling.
- Deploying manager-api to `cleitin-server` as a systemd service (separate change).

## Decisions

### Provider `mysql` + `@prisma/adapter-mariadb`
Prisma has no `mariadb` provider; MariaDB is supported through the `mysql` provider. Since the project already uses driver adapters (Prisma 7 default), the runtime uses `@prisma/adapter-mariadb` (`PrismaMariaDb`) on top of the `mariadb` npm driver, mirroring the current `PrismaPg` setup.
- *Alternative*: `mysql2` driver — not what Prisma's official MariaDB adapter uses; rejected.

### Keep `DATABASE_URL` as a single URL
`DATABASE_URL` stays a URL (`mysql://user:pass@host:3306/db`) so the env shape and `prisma.config.ts` (`DIRECT_URL`) stay the same. `PrismaService` parses it with the WHATWG `URL` class into `{ host, port, user, password, database, connectionLimit }` for `PrismaMariaDb` (decoding user/password with `decodeURIComponent`). Passing the object instead of the raw string avoids depending on how the adapter interprets the `mysql://` scheme.
- *Alternative*: separate `DB_HOST`, `DB_USER`, ... vars — more env churn and duplication with `DIRECT_URL`; rejected.

### Small connection pool
`connectionLimit: 5`. The server allows 30 connections total, shared with `core-api` and `rsf`, and has 64 MB of buffer pool. Five is enough for this API's load.

### Fresh baseline migration instead of converting SQL
Postgres DDL (`TIMESTAMP(3)`, `"quoted"` identifiers, `CONSTRAINT ... PRIMARY KEY`) is not valid MariaDB SQL and `migration_lock.toml` is provider-locked. Delete `prisma/migrations/` and run `prisma migrate dev --name init` against an empty MariaDB database. The schema is a single table, so there is no history worth preserving.
- `prisma migrate dev` needs a shadow database. The `manager` user is given `CREATE`/`DROP` on `manager_shadow` too, and `shadowDatabaseUrl` is set in `prisma.config.ts` through a `SHADOW_DATABASE_URL` env var (dev only).

### Schema type mapping
No model changes are needed. Prisma maps `String @id` to `VARCHAR(191)`, `String` to `VARCHAR(191)`, `DateTime` to `DATETIME(3)`. `password` holds a bcrypt hash (60 chars) and `name`/`email` fit in 191, so no `@db.*` annotations are required.

### Dedicated `manager` database and user
Create database `manager` (`utf8mb4_unicode_ci`) and user `manager`@`192.168.100.%` (+ `localhost` for a future on-server deploy), with `ALL PRIVILEGES` on `manager.*` and `manager_shadow.*` only. Also grant `claude` on `manager.*`, following the server README convention. These statements run as `root` over SSH; the change only documents and executes them.
- *Alternative*: reuse `core` — it is reserved for core-api; rejected.

### Case-insensitive email
With `utf8mb4_unicode_ci`, both the unique index on `email` and `findUnique({ where: { email } })` compare case-insensitively. The existing pre-check in `UserService.create()` therefore already returns 409 for a case variant; no code change is required beyond a test.

## Risks / Trade-offs

- [Credentials in `.env` on the dev machine; DB reachable by the whole LAN] → `.env` is already git-ignored; the `manager` user is limited to its own databases and `192.168.100.%`.
- [`postinstall` runs `prisma migrate deploy`; `yarn install` fails if MariaDB is unreachable] → document it; keep as-is (out of scope) but mention in README.
- [Existing Postgres data lost] → optional one-off copy step (tasks group 6) before decommissioning Postgres.
- [`mariadb` driver on ARMv7 for a future on-server deploy] → pure JS driver, no native build required.
- [Connection limit pressure on a shared 30-connection server] → pool capped at 5.

## Migration Plan

1. Create `manager` / `manager_shadow` databases and the `manager` user on `cleitin-server` (as root).
2. Fill `.env` with the real password.
3. Swap dependencies, schema provider, and `PrismaService`; regenerate the client.
4. Recreate migrations (`prisma migrate dev --name init`), then `prisma migrate deploy` on `manager`.
5. Optionally copy users from Postgres.
6. Run unit tests, start the app, exercise sign-up / sign-in / profile.

Rollback: `git revert` the change and point `DATABASE_URL`/`DIRECT_URL` back to Postgres; the Postgres database is untouched by this change.

## Open Questions

- Is there production data in the old Postgres database that must be copied? (Only affects whether task group 6 is executed.)
