## Why

The tenant-isolation feature was removed from the domain model — the `User` entity, Prisma schema, and service layer no longer carry `tenantName`, and the JWT payload no longer includes the `tenant` claim. However, several test files and one interface file still reference tenant fields, causing tests to diverge from the real implementation and misleading future contributors.

## What Changes

- Remove `tenant` field from `JwtPayload` interface (`src/modules/auth/interfaces/index.ts`)
- Update `auth.service.spec.ts`: remove `tenantName` from the user fixture and update `signAsync` assertions to match the current `{ sub }` payload
- Update `auth.strategy.spec.ts`: rewrite the `validate` test to reflect the current implementation (returns only `{ id }`); remove the two tenant-validation tests that no longer correspond to any production code
- Update `websocket.gateway.spec.ts`: remove `tenant` from `verifyAsync` mock payloads, remove `tenantName` from `socket.data.user` expectations, remove the two tenant-claim rejection tests, and update `handleConnection` / `handleDisconnect` assertions to match the `ConnectedUser` shape (no `tenantName`)

## Capabilities

### New Capabilities

_(none — this is a cleanup, no new capabilities are introduced)_

### Modified Capabilities

- `auth`: JWT payload and strategy validation no longer include or enforce a tenant claim
- `websocket`: Handshake authentication and connected-user tracking no longer carry `tenantName`

## Impact

- **Files changed**: `src/modules/auth/interfaces/index.ts`, `src/modules/auth/auth.service.spec.ts`, `src/modules/auth/auth.strategy.spec.ts`, `src/modules/websocket/websocket.gateway.spec.ts`
- **No API surface changes** — all modifications are internal types and tests
- **No database migration needed** — `tenantName` was already removed from the Prisma schema
- **Test suite will be consistent** with the current production implementation after this change
