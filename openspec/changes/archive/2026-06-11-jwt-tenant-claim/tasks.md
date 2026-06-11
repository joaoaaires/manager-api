## 1. Constante Compartilhada

- [x] 1.1 Criar `src/modules/tenant/tenant-name.constants.ts` exportando `TENANT_NAME_PATTERN` (`/^[a-z_][a-z0-9_]{0,62}$/`)
- [x] 1.2 Atualizar `TenantProvisioningService` para importar a constante compartilhada em vez da definição local

## 2. Emissão do Token

- [x] 2.1 Incluir `tenant: user.tenant_name` no payload de `AuthService.register()` e `AuthService.access()`

## 3. Validação e Propagação

- [x] 3.1 Estender `JwtPayload` com `tenant: string` e `AuthenticatedUser` com `tenantName: string` em `src/modules/auth/interfaces/index.ts`
- [x] 3.2 Em `AuthStrategy.validate()`: lançar `UnauthorizedException` se `payload.tenant` estiver ausente ou não casar com `TENANT_NAME_PATTERN`; retornar `{ id: payload.sub, tenantName: payload.tenant }`
- [x] 3.3 Remover o `tenantName` do retorno das APIs.

## 4. Testes

- [x] 4.1 Atualizar `auth.service.spec.ts`: asserts de `signAsync` passam a esperar `{ sub, tenant }` em register e access
- [x] 4.2 Criar `src/modules/auth/auth.strategy.spec.ts`: claim válida propaga `{ id, tenantName }`; claim ausente lança `UnauthorizedException`; claim malformada (ex.: `Tenant-X"; DROP`) lança `UnauthorizedException`
- [x] 4.3 Executar `npm test` e garantir que todos os testes passam

## 5. Validação Final

- [x] 5.1 Executar `npm run build` sem erros de TypeScript
- [x] 5.2 Executar `npm run lint` e corrigir eventuais avisos
- [x] 5.3 Executar `npm run test:e2e` e confirmar que continuam passando
