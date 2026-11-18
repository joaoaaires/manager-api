## Context

See proposal.md for motivation. Current state:

- NestJS 11.1, `@nestjs/cli` 11, TypeScript 5.9, CommonJS output (`module: nodenext` but no `"type": "module"`, imports without extensions).
- Jest 30 + ts-jest for unit tests (`src/**/*.spec.ts`, 17 tests) and e2e (`test/*.e2e-spec.ts`, already run with `--experimental-vm-modules`).
- Path aliases in `tsconfig.json` (`@prisma-client` → `./generated/prisma/client`, `~/*` → `./src/*`), rewritten by the Nest CLI at build time; 4 imports use them.
- Prisma 7 client generated to `generated/prisma` with `moduleFormat = "cjs"`; build output lands in `dist/src/main.js`.
- Every NestJS 12 package is published as `"type": "module"` only (`exports` point to `.js` ESM files). `@nestjs/cli` 12 pins `typescript ~6.0.2`. `typescript-eslint` 8.x supports TS `<6.1`.
- `core-api` is already on Nest 12 with ESM + Vitest 4 + Vite 8 and is the reference setup.

## Goals / Non-Goals

**Goals:**
- All `@nestjs/*` packages on latest 12.x; project builds, lints, tests and runs as native ESM.
- Same tooling shape as `core-api` (Vitest, `resolve.tsconfigPaths`-free setup, `.js` import specifiers).

**Non-Goals:**
- Switching ESLint to oxlint (as `core-api` did) or upgrading ESLint 9 → 10.
- Upgrading TypeScript to 7.x (not supported by Nest CLI 12 or typescript-eslint yet).
- Fixing or deleting the stale tenant e2e spec (`test/user-tenant.e2e-spec.ts`) beyond porting it to Vitest; if it fails for tenant reasons it is reported, not rewritten.
- Any behavior change in HTTP routes, WebSocket gateway or database access.

## Decisions

### Native ESM instead of relying on `require(esm)`
Chosen by the user. Node 22.12+ can `require()` ESM, but staying CommonJS would leave the project off the Nest 12 default and make Jest unusable anyway. Set `"type": "module"`, keep `module`/`moduleResolution: nodenext`, and add `.js` to every relative import (`./app.module` → `./app.module.js`, directory imports → `./dir/index.js`). The rewrite is mechanical; a script can do it and `tsc` (nodenext) reports any import left without an extension.

### Vitest + Vite 8 for tests
Chosen by the user. Jest's ESM mode is experimental and `jest.mock` does not work the same way under ESM. Vitest runs ESM natively and Vite 8 (Oxc) honors `experimentalDecorators` / `emitDecoratorMetadata`, which Nest DI in `Test.createTestingModule` needs — the same as in `core-api`. Use `globals: true` so `describe`/`it`/`expect` stay unchanged; replace `jest.fn/spyOn/clearAllMocks` with `vi.*` and `jest.Mock`/`jest.SpyInstance` types with Vitest's `Mock`/`MockInstance`. Separate `vitest.config.ts` (unit, `src/**/*.spec.ts`) and `vitest.config.e2e.ts` (`test/**/*.e2e-spec.ts`).
- Use the latest Vitest major compatible with Vite 8 and the Node versions in use (Vitest 5 requires Node ≥ 22.12: Mac has 24, server has 22.23).

### Relative imports instead of tsconfig `paths`
TS 6 deprecates `baseUrl`, and today `paths` only work at runtime because the Nest CLI rewrites them during build; Vitest would need extra config, and Node itself never sees them. Only 4 imports use aliases, so replace them all with relative imports and delete `paths`:
- `~/*` → relative path inside `src/`.
- `@prisma-client` → e.g. `../../generated/prisma/client.js`. This resolves the same in source (`src/database` → `generated/`), in Vitest, and in the build (`dist/src/database` → `dist/generated/`), since the build keeps the project layout under `dist/`.
- *Alternatives*: `package.json` `"imports"` (`#prisma-client`) needs conditions to switch between source and `dist/`; keeping `paths` with Nest CLI rewriting + `resolve.tsconfigPaths` in Vitest (as core-api) depends on two tools agreeing. Both rejected as more moving parts for 4 imports.

### Prisma client as ESM
Set the generator to `moduleFormat = "esm"` (and `importFileExtension = "js"`) so the generated client is valid ESM under nodenext; regenerate.

### TypeScript 6 config
TS 6 changes defaults: `strict` defaults to `true`, `types` defaults to `[]`, `baseUrl` is deprecated, `rootDir` defaults to the tsconfig directory. Keep current strictness explicitly (`"strict": false` plus the existing `strictNullChecks: true`, `noImplicitAny: false`, etc.) so the upgrade does not turn into a type-strictness refactor; set `"types": ["node", "vitest/globals"]`; remove `baseUrl`; set `"rootDir": "."` explicitly (keeps `dist/src/main.js`).

### ESLint stays on 9 + typescript-eslint
Only bump `typescript-eslint` to a release supporting TS 6.0; change `sourceType` to `module` and `globals.jest` to `globals.vitest` (or drop it — spec files are already ignored).

### CommonJS dependencies under ESM
`bcrypt`, `passport-jwt`, `class-validator`, `class-transformer`, `serverless-http` are CommonJS. Node's CJS named-export detection covers `passport-jwt` (`ExtractJwt`, `Strategy`); for `bcrypt`, `import * as bcrypt` may only expose `default` under ESM — switch to `import bcrypt from 'bcrypt'` if `tsc`/runtime complain.

## Risks / Trade-offs

- [Nest 12 breaking API changes beyond ESM affect the code] → build with `tsc` after the bump and fix errors before converting tests; check the official 11→12 migration guide during implementation.
- [Third-party packages without a 12-compatible release (e.g. `@nestjs/throttler` 6.x)] → keep them if their peer range includes `^12.0.0` (it does for throttler 6.8).
- [Decorator metadata missing in Vitest makes DI fail in tests] → mirrors core-api's working setup; if it fails, add `unplugin-swc`.
- [Missed `.js` extension causes runtime `ERR_MODULE_NOT_FOUND`] → `tsc` with nodenext errors on extensionless relative imports in ESM; also boot the app and hit `/health`.
- [`postinstall` runs `prisma migrate deploy` during every `yarn install`] → unchanged; DB must be reachable (already documented).
- [Deploy to the ARM server runs Node 22.23] → satisfies Nest 12 (`>=20`) and Vite/Vitest only run on the Mac.

## Migration Plan

Single branch; implement in this order so each step is verifiable: dependency bump → TS 6 config → ESM conversion (build + run) → Vitest port (tests green) → lint → run app against MariaDB. Rollback: `git revert` the change commits and `yarn install`.
