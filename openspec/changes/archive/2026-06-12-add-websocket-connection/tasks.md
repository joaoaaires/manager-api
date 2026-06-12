## 1. Setup

- [x] 1.1 Instalar dependÃªncias `@nestjs/websockets`, `@nestjs/platform-socket.io` e `socket.io`
- [x] 1.2 Criar estrutura do mÃ³dulo `src/modules/websocket/` (module, gateway, service, interfaces)

## 2. PresenÃ§a em memÃ³ria

- [x] 2.1 Criar interface `ConnectedUser` (`socketId`, `userId`, `tenantName`, `connectedAt`) em `src/modules/websocket/interfaces/`
- [x] 2.2 Implementar `ConnectedUsersService` com array privado e mÃ©todos `add`, `remove(socketId)` (idempotente, retorna a entrada removida ou `undefined`) e `list()`
- [x] 2.3 Escrever testes unitÃ¡rios do `ConnectedUsersService` (add/remove, mÃºltiplas conexÃµes do mesmo usuÃ¡rio, remove de socket desconhecido como no-op)

## 3. Gateway autenticado

- [x] 3.1 Implementar `WebsocketGateway` com `@WebSocketGateway` usando CORS de `corsOrigin` via `ConfigService`
- [x] 3.2 Em `afterInit`, registrar middleware do Socket.IO que extrai o token de `handshake.auth.token` (fallback header `Authorization: Bearer`), verifica com `JwtService.verifyAsync` (`secret`, `issuer`, `audience`), valida claim `tenant` contra `TENANT_NAME_PATTERN` e anexa `AuthenticatedUser` em `socket.data.user`; falha â‡’ `next(new Error('Unauthorized'))`
- [x] 3.3 Implementar `handleConnection`: adicionar usuÃ¡rio no `ConnectedUsersService` e logar entrada com `userId` e `tenantName`
- [x] 3.4 Implementar `handleDisconnect`: remover pelo `socketId` e, se havia entrada, logar saÃ­da com `userId` e `tenantName`
- [x] 3.5 Escrever testes unitÃ¡rios do gateway (handshake aceito com token vÃ¡lido; rejeitado sem token, com token invÃ¡lido/expirado e com tenant invÃ¡lido; logs e add/remove nos eventos)

## 4. IntegraÃ§Ã£o

- [x] 4.1 Criar `WebsocketModule` registrando gateway e service (importar `JwtModule`/`ConfigModule` conforme necessÃ¡rio) e adicionÃ¡-lo em `src/app.module.ts`
- [x] 4.2 Verificar build (`npm run build`), lint (`npm run lint`) e suÃ­te de testes (`npm test`)
- [x] 4.3 ValidaÃ§Ã£o manual: conectar um cliente Socket.IO com token vÃ¡lido e outro sem token; confirmar logs de entrada/saÃ­da e rejeiÃ§Ã£o do nÃ£o autenticado
