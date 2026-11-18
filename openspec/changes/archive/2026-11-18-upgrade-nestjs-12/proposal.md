## Why

The project is on NestJS 11 while NestJS 12 (`12.5.x`) is current, and the sibling `core-api` already runs on 12. NestJS 12 ships ESM-only packages and its CLI is built on TypeScript 6.0, so staying on 11 means drifting further from supported tooling and from the pattern used across the other projects.

## What Changes

- Upgrade all `@nestjs/*` packages to their latest 12.x releases (`@nestjs/throttler` to its latest 6.x, which supports 12). Packages without a 12 line yet keep their latest compatible version.
- **BREAKING (build/tooling)**: convert the project from CommonJS to ESM (`"type": "module"`, relative imports with `.js` extensions, Prisma client generated as ESM).
- **BREAKING (build/tooling)**: upgrade TypeScript 5.9 → 6.0 (required by `@nestjs/cli` 12) and adjust `tsconfig.json` for TS 6 defaults (no `baseUrl`, explicit `strict`/`types`).
- **BREAKING (tests)**: replace Jest/ts-jest with Vitest + Vite 8 (same setup as `core-api`); port unit and e2e specs (`jest.*` → `vi.*`).
- Replace the `tsconfig` path aliases (`~/*`, `@prisma-client`, 4 imports) with relative imports, which work natively in ESM at runtime, in TypeScript and in Vitest.
- Remove dependencies that become unused: `jest`, `ts-jest`, `@types/jest`, `ts-node`, `tsconfig-paths`, `ts-loader`.

No HTTP, WebSocket or database behavior changes.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

_(none — framework and tooling upgrade only; no spec-level behavior changes. `skip_specs: true` is set.)_

## Impact

- **Code**: every `.ts` file with relative imports (~46 files, ~83 imports), `src/main.ts`, the 4 files using path aliases, all `*.spec.ts` and `test/*.e2e-spec.ts`.
- **Config**: `package.json` (type, scripts, imports, deps), `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `eslint.config.mjs`, `prisma/schema.prisma` (generator `moduleFormat`), new `vitest.config.ts` / `vitest.config.e2e.ts`, removal of `test/jest-e2e.json` and the `jest` block in `package.json`.
- **Runtime**: Node ≥ 22.12 required (Vitest 5 / Vite 8 / Nest 12); dev Mac is on Node 24 and `cleitin-server` on Node 22.23.
- **Workflow**: `yarn test` / `test:e2e` run on Vitest; `yarn start:prod` keeps working from `dist/src/main.js`.
