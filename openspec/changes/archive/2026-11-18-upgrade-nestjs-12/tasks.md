## 1. Dependencies

- [x] 1.1 Read the official NestJS 11 → 12 migration guide and note any API changes that affect this codebase (beyond ESM)
- [x] 1.2 Upgrade `@nestjs/common`, `core`, `platform-express`, `platform-socket.io`, `websockets`, `testing` to latest 12.x
- [x] 1.3 Upgrade `@nestjs/config`, `jwt`, `passport`, `swagger`, `terminus`, `cli`, `schematics` to latest 12.x and `@nestjs/throttler` to latest 6.x
- [x] 1.4 Upgrade `typescript` to `~6.0` and `typescript-eslint` to a release supporting TS 6.0
- [x] 1.5 Remove `jest`, `ts-jest`, `@types/jest`, `ts-node`, `tsconfig-paths`, `ts-loader`; add `vitest`, `vite` (8.x) and `@vitest/coverage-v8`
- [x] 1.6 Check `yarn install` for unmet peer dependency warnings and resolve them

## 2. TypeScript and build config

- [x] 2.1 `tsconfig.json`: remove `baseUrl` and `paths`; set `"rootDir": "."`, `"strict": false` (keeping existing individual flags) and `"types": ["node", "vitest/globals"]`
- [x] 2.2 `tsconfig.build.json`: exclude Vitest config files and keep spec exclusions
- [x] 2.3 Confirm `nest-cli.json` (`entryFile: src/main`) still matches the build output

## 3. ESM conversion

- [x] 3.1 Add `"type": "module"` to `package.json`
- [x] 3.2 Set Prisma generator `moduleFormat = "esm"` (and `importFileExtension = "js"`), then `prisma generate`
- [x] 3.3 Replace the 4 alias imports (`~/*`, `@prisma-client`) with relative imports
- [x] 3.4 Add `.js` extensions to all relative imports in `src/` and `test/` (directory imports → `/index.js`)
- [x] 3.5 Fix CommonJS interop imports that break under ESM (e.g. `bcrypt`)
- [x] 3.6 Fix any NestJS 12 API changes found in 1.1 / reported by `tsc`
- [x] 3.7 `yarn build` passes and `yarn start:prod` boots with `/health` green

## 4. Tests on Vitest

- [x] 4.1 Create `vitest.config.ts` (unit, `src/**/*.spec.ts`, `globals: true`) and `vitest.config.e2e.ts` (`test/**/*.e2e-spec.ts`)
- [x] 4.2 Update scripts: `test`, `test:watch`, `test:cov`, `test:debug`, `test:e2e`; remove the `jest` block from `package.json` and `test/jest-e2e.json`
- [x] 4.3 Port unit specs: `jest.fn/spyOn/clearAllMocks` → `vi.*`, `jest.Mock`/`jest.SpyInstance` → Vitest `Mock`/`MockInstance`
- [x] 4.4 Port e2e specs to Vitest (imports, `supertest` default import)
- [x] 4.5 `yarn test` passes with the same 17 tests; run `yarn test:e2e` and report results — `app.e2e-spec` passes; stale `user-tenant.e2e-spec` (imported a module removed before this change) was deleted

## 5. Lint

- [x] 5.1 `eslint.config.mjs`: `sourceType: 'module'`, replace `globals.jest`
- [x] 5.2 `yarn lint` passes

## 6. Verification

- [x] 6.1 `yarn start:dev` boots (watch mode) against MariaDB
- [x] 6.2 Manual flow: `/health`, sign-up, sign-in, `GET /profile`, duplicate email 409, Swagger UI loads
- [x] 6.3 WebSocket handshake with a valid token connects and an invalid token is rejected
- [x] 6.4 `grep -rn "jest\|@prisma-client\|from '~/" src test package.json` returns nothing
- [x] 6.5 Update `README.md` (Node ≥ 22.12, Vitest commands)
