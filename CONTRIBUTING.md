# Contributing

## Layout

- `src/modules/<feature>/` — Nest feature modules (controllers stay thin; orchestration in services).
- `src/common/` — Cross-cutting code (filters, shared middleware, utilities).
- `src/config/` — Environment loading and validation.
- `prisma/` — Schema and migrations; run `yarn db:migrate:dev` after schema changes.

## Architecture notes

- **UserRepository port:** deferred until a second aggregate needs shared persistence patterns; see `openspec/changes/archive/2026-03-13-manager-api-technical-improvements/design.md`.

## Rules

- Do not return Prisma models directly from controllers; map to DTOs.
- Do not expose password hashes or internal fields in API responses.
- Prefer `getOrThrow` for required config in modules that need secrets.

## OpenSpec

Larger changes can be proposed under `openspec/changes/<name>/`. Baseline capabilities live under `openspec/specs/` (synced from archived change `2026-03-13-manager-api-technical-improvements`).

## Checks

```bash
yarn lint
yarn test
yarn build
yarn test:e2e   # mocks Prisma; no local DB required
yarn test:integration   # real DB; set RUN_INTEGRATION_TESTS=1 and full .env (see README)
```
