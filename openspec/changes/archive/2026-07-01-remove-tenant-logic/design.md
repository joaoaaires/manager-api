## Context

The production code (entity, service, repository, Prisma schema, auth service, auth strategy, and websocket gateway) has already had all tenant logic removed. The JWT payload now only carries `{ sub }`, the `AuthStrategy.validate()` method returns `{ id }`, and `ConnectedUser` has no `tenantName` field.

What remains is a mismatch between production code and: (1) the `JwtPayload` interface that still declares `tenant: string`, and (2) three test files that assert tenant-related behavior that no longer exists.

## Goals / Non-Goals

**Goals:**
- Remove the `tenant` field from the `JwtPayload` interface so the type reflects the actual JWT shape
- Update all test files to assert the real behavior of the current implementation (no tenant in JWT, no tenant validation in strategy or gateway, no tenantName in connected-user tracking)
- Delete test cases that covered now-removed tenant-validation code paths

**Non-Goals:**
- Changing any production/runtime behavior (all production code is already updated)
- Adding or modifying Prisma migrations
- Touching any other module (user controller, health check, config, etc.)

## Decisions

**Delete tenant-validation test cases rather than adapt them**
The three tenant-specific test cases in `auth.strategy.spec.ts` (`propagates id and tenantName`, `rejects a payload without tenant claim`, `rejects a malformed tenant claim`) and two in `websocket.gateway.spec.ts` (`rejects a payload without tenant claim`, `rejects a malformed tenant claim`) describe behavior that no longer exists in production code. Adapting them to pass would mean testing a false contract. Deletion is correct.

**Keep non-tenant test structure intact**
Tests covering JWT signature verification, token extraction, connection tracking (add/remove), and disconnection logging remain valid — only the data fixtures need `tenantName` stripped out.

**Single-pass interface cleanup**
The `JwtPayload` interface change (`tenant: string` → removed) is a non-breaking internal change. No consumers outside this codebase depend on the type. One edit in `interfaces/index.ts` cascades correctly because both `AuthStrategy` and `WebsocketGateway` already stopped reading `payload.tenant`.

## Risks / Trade-offs

- **Risk**: A future feature re-introduces multi-tenancy and developers miss that the specs were intentionally removed. → **Mitigation**: The REMOVED requirements in the delta specs include reason and migration notes.
- **Trade-off**: Removing tests reduces coverage of the old tenant validation code paths, but that code is already gone — keeping dead tests would give false confidence in non-existent guards.
