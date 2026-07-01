## 1. Auth Module — Service Layer

- [x] 1.1 Criar `src/modules/auth/services/auth.service.interface.ts` com `IAuthService` e `AUTH_SERVICE` Symbol
- [x] 1.2 Mover `auth.service.ts` para `src/modules/auth/services/auth.service.ts` e implementar `IAuthService`
- [x] 1.3 Substituir injeção de `UserService` por `@Inject(USER_SERVICE) private readonly userService: IUserService`
- [x] 1.4 Corrigir chamadas de método obsoletas: `userService.create` → `createUser`, `userService.readOneByEmail` → `getUserByEmail`
- [x] 1.5 Remover o arquivo `src/modules/auth/auth.service.ts` antigo

## 2. Auth Module — Controller Layer

- [x] 2.1 Mover `auth.controller.ts` para `src/modules/auth/controllers/auth.controller.ts`
- [x] 2.2 Atualizar imports do controller para `../services/auth.service.interface` e `../dto`
- [x] 2.3 Substituir injeção de `AuthService` concreto por `@Inject(AUTH_SERVICE) private readonly authService: IAuthService`
- [x] 2.4 Remover o arquivo `src/modules/auth/auth.controller.ts` antigo

## 3. Auth Module — DTOs e Module

- [x] 3.1 Mover `sign-up.dto.ts` para `src/modules/auth/dto/request/sign-up.dto.ts`
- [x] 3.2 Mover `sign-in.dto.ts` para `src/modules/auth/dto/request/sign-in.dto.ts`
- [x] 3.3 Mover `auth-response.dto.ts` para `src/modules/auth/dto/response/auth-response.dto.ts`
- [x] 3.4 Atualizar `src/modules/auth/dto/index.ts` para re-exportar de `./request` e `./response`
- [x] 3.5 Remover arquivos DTO antigos da raiz de `dto/`
- [x] 3.6 Atualizar `auth.module.ts`: importar de `./services/auth.service` e `./controllers/auth.controller`; registrar `AuthService` com token `AUTH_SERVICE`

## 4. Tenant Module — Service Layer

- [x] 4.1 Criar `src/modules/tenant/services/tenant-provisioning.service.interface.ts` com `ITenantProvisioningService` e `TENANT_PROVISIONING_SERVICE` Symbol
- [x] 4.2 Mover `tenant-provisioning.service.ts` para `src/modules/tenant/services/tenant-provisioning.service.ts` e implementar `ITenantProvisioningService`
- [x] 4.3 Corrigir import do `PrismaService` de `../prisma/prisma.service` para `~/database/prisma.service`
- [x] 4.4 Remover o arquivo `src/modules/tenant/tenant-provisioning.service.ts` antigo
- [x] 4.5 Atualizar `tenant-provisioning.module.ts`: importar de `./services/`; registrar com token `TENANT_PROVISIONING_SERVICE`; exportar o token

## 5. Websocket Module — Service Layer

- [x] 5.1 Criar `src/modules/websocket/services/connected-users.service.interface.ts` com `IConnectedUsersService` e `CONNECTED_USERS_SERVICE` Symbol
- [x] 5.2 Mover `connected-users.service.ts` para `src/modules/websocket/services/connected-users.service.ts` e implementar `IConnectedUsersService`
- [x] 5.3 Atualizar `WebsocketGateway` para injetar `@Inject(CONNECTED_USERS_SERVICE) private readonly connectedUsersService: IConnectedUsersService`
- [x] 5.4 Remover o arquivo `src/modules/websocket/connected-users.service.ts` antigo
- [x] 5.5 Atualizar `websocket.module.ts`: importar de `./services/`; registrar `ConnectedUsersService` com token `CONNECTED_USERS_SERVICE`

## 6. Verificação Final

- [x] 6.1 Executar `npm run build` e confirmar que não há erros de compilação
- [x] 6.2 Executar `npm run test` e confirmar que todos os testes passam
- [x] 6.3 Verificar que não há mais referências ao caminho `../prisma/prisma.service` no projeto
- [x] 6.4 Verificar que não há mais referências ao caminho `./auth.service` (fora do services/) ou `./auth.controller` (fora do controllers/)
