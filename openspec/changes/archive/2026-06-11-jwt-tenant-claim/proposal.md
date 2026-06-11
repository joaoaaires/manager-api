# Proposal: jwt-tenant-claim

## Why

O payload do JWT hoje contém apenas `{ sub: user.id }`. Qualquer endpoint futuro que opere no schema do tenant (ex.: CRUD de `notes`) precisará de uma consulta ao banco por requisição apenas para resolver o `tenant_name` do usuário. Como o `tenant_name` é 1:1 com o usuário e imutável (gerado no sign-up), ele é um candidato ideal a claim do token: elimina uma roundtrip do caminho quente sem risco relevante de claim desatualizada.

## What Changes

- Incluir a claim `tenant` no payload do JWT emitido por `AuthService.register()` e `AuthService.access()`
- Estender `JwtPayload` (campo `tenant`) e `AuthenticatedUser` (campo `tenantName`) em `auth/interfaces`
- `AuthStrategy.validate()` passa a exigir a claim `tenant` e validar seu formato contra `^[a-z_][a-z0-9_]{0,62}$` antes de propagá-la — claim ausente ou malformada resulta em 401 (defesa em profundidade: mesmo com `SECRET` comprometido, um token forjado não vira SQL injection nos pontos que interpolam `tenant_name` em SQL cru)
- Extrair o padrão de nome de tenant para uma constante compartilhada no módulo tenant (hoje é privado do `TenantProvisioningService`)
- **BREAKING (operacional)**: tokens emitidos antes desta mudança não contêm a claim e passarão a ser rejeitados com 401, forçando novo login (expiração atual de 24h limita o impacto)

## Capabilities

### New Capabilities

- `jwt-tenant-claim`: o token JWT carrega o tenant do usuário como claim validada, disponível para os handlers via `request.user.tenantName`

### Modified Capabilities

(nenhuma — nenhum requirement existente muda; `tenant-schema-safety` continua válido e a validação na strategy é uma camada adicional)

## Impact

- **Código**: `src/modules/auth/auth.service.ts`, `src/modules/auth/auth.strategy.ts`, `src/modules/auth/interfaces/index.ts`, `src/modules/tenant/tenant-provisioning.service.ts` (extração da constante)
- **APIs**: contrato de resposta inalterado; comportamento novo: 401 para tokens sem a claim `tenant`
- **Dependências**: nenhuma nova
- **Testes**: atualizar asserts de payload em `auth.service.spec.ts`; novo spec para `AuthStrategy.validate()`
