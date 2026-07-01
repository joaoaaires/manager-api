## 1. Fix JwtPayload Interface

- [x] 1.1 Remove the `tenant: string` field from `JwtPayload` in `src/modules/auth/interfaces/index.ts`

## 2. Update auth.service.spec.ts

- [x] 2.1 Remove `tenantName` field from the `buildUser` fixture
- [x] 2.2 Update `signAsync` assertion in the `register` test to expect `{ sub: user.id }` only
- [x] 2.3 Update `signAsync` assertion in the `access` test to expect `{ sub: user.id }` only

## 3. Update auth.strategy.spec.ts

- [x] 3.1 Rename the `validate` test to `'returns id for a valid payload'` and update expectation to `{ id: 'user-id' }` (remove `tenantName`)
- [x] 3.2 Delete the test case `'rejects a payload without tenant claim'`
- [x] 3.3 Delete the test case `'rejects a malformed tenant claim'`

## 4. Update websocket.gateway.spec.ts

- [x] 4.1 Remove `tenant` from the `verifyAsync` mock return value in the "accepts a connection with a valid token" test; remove `tenantName` from the `socket.data` expectation
- [x] 4.2 Remove `tenant` from the `verifyAsync` mock in the "accepts a token from the Authorization Bearer header" test
- [x] 4.3 Delete the test case `'rejects a payload without tenant claim'`
- [x] 4.4 Delete the test case `'rejects a malformed tenant claim'`
- [x] 4.5 Update the `handleConnection` "tracks the user" test: remove `tenantName` from `socket.data.user` fixture and from the `connectedUsersService.list()` expectation
- [x] 4.6 Update the `handleDisconnect` "removes the user" test: remove `tenantName` from `socket.data.user` fixture

## 5. Verify

- [x] 5.1 Run `pnpm test` (or `npm test`) and confirm all tests pass with no tenant-related failures
