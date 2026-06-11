## Context

A API é multi-tenant com um schema PostgreSQL por usuário (`tenant_name`, formato `tenant_<8 hex>`, gerado no sign-up e imutável). O JWT emitido por `AuthService` carrega apenas `sub`. O `AuthStrategy.validate()` devolve `{ id: payload.sub }`, que chega aos handlers como `request.user`. Pontos relevantes do estado atual:

- `tenant_name` é interpolado em SQL cru em mais de um lugar (`CREATE SCHEMA`, DDL de provisionamento, futuro acesso a `notes`), protegido hoje pela validação regex no `TenantProvisioningService` e pela origem confiável do valor (banco/`randomBytes`)
- `JWT_EXPIRES_IN` padrão é 86400s (24h); não há refresh token
- A change `api-hardening-reliability` adicionou o filtro de soft delete em `readOneByEmail`/`readOneById` — usuário com `deleteAt` preenchido não autentica nem carrega profile

## Goals / Non-Goals

**Goals:**
- Claim `tenant` no payload do JWT (register e access)
- `request.user` tipado como `{ id, tenantName }` para todos os handlers protegidos por `AuthGuard`
- Validação de formato da claim na strategy antes de qualquer propagação
- Rejeição (401) de tokens sem a claim ou com claim malformada

**Non-Goals:**
- Guard de revalidação no banco para operações sensíveis (mitigação do gap de soft delete vs. claims em cache) — registrado como follow-up, não bloqueia esta change
- Refresh tokens ou redução do tempo de expiração
- Endpoints que consumam o tenant (CRUD de `notes`) — esta change só disponibiliza a claim
- Suporte retrocompatível a tokens antigos sem a claim

## Decisions

### D1 — Nome da claim: `tenant`

Claim curta e privada (`tenant`), seguindo o estilo do payload atual (`sub`). Sem namespace de URL (padrão usado quando há risco de colisão em federações OIDC — não é o caso de um token interno).

**Alternativa considerada**: `tenant_name` espelhando a coluna. Rejeitado: claims JWT tendem a nomes curtos; o mapeamento para `tenantName` acontece na borda (strategy).

### D2 — Tokens sem a claim são rejeitados com 401

`AuthStrategy.validate()` exige `payload.tenant` presente e válido; ausência ou formato inválido lança `UnauthorizedException`. Tokens emitidos antes do deploy expiram em até 24h; o custo é um re-login único por usuário ativo.

**Alternativa considerada**: fallback com lookup no banco quando a claim falta (retrocompatibilidade total). Rejeitado: mantém dois caminhos de código vivos para uma janela de 24h e reintroduz a roundtrip que a change elimina.

### D3 — Validação de formato na strategy com constante compartilhada

Extrair `TENANT_NAME_PATTERN` (`^[a-z_][a-z0-9_]{0,62}$`) do `TenantProvisioningService` para export nomeado do módulo tenant (ex.: `src/modules/tenant/tenant-name.constants.ts`), consumido pelo service e pela strategy. A validação na strategy é defesa em profundidade: a assinatura do token já garante integridade, mas se o `SECRET` vazar, um token forjado com `tenant` malicioso não passa do `validate()` — nunca chega aos pontos de interpolação SQL.

**Alternativa considerada**: duplicar o regex na strategy. Rejeitado: drift silencioso entre as duas cópias é exatamente o tipo de bug que a constante elimina.

### D4 — `AuthenticatedUser` ganha `tenantName: string` (obrigatório)

Como D2 rejeita tokens sem a claim, todo `request.user` válido tem tenant — o campo é obrigatório, sem `?`, e os handlers não precisam de null-check.

## Risks / Trade-offs

- **[Usuários ativos no deploy recebem 401 até relogar]** → Janela limitada pela expiração de 24h; comunicar no changelog. Clientes que tratam 401 com redirect para login se recuperam sozinhos.
- **[Claim em cache não reflete soft delete imediato]** → Já é verdade para o próprio `sub` (token vale até expirar). O guard de revalidação para operações sensíveis fica como follow-up; o gap não aumenta com esta change — apenas fica mais visível quando endpoints passarem a usar `tenantName` sem tocar a tabela `User`.
- **[Renomear/migrar tenant no futuro invalidaria a claim]** → Fora do modelo atual (tenant imutável). Se um dia houver migração de tenant, a estratégia de invalidação de tokens precisa ser desenhada junto.

## Migration Plan

1. Extrair `TENANT_NAME_PATTERN` para constante compartilhada; atualizar `TenantProvisioningService`
2. Incluir `tenant` no payload em `AuthService.register()` e `access()`
3. Estender `JwtPayload`/`AuthenticatedUser`; validar e propagar na `AuthStrategy`
4. Atualizar testes (`auth.service.spec.ts`) e criar `auth.strategy.spec.ts`
5. `npm test`, `npm run build`, `npm run lint`, `npm run test:e2e`

**Rollback**: `git revert` simples — tokens emitidos com a claim extra continuam válidos para o código antigo (claim ignorada).

## Open Questions

- Quando os endpoints de `notes` forem criados, definir quais operações exigem revalidação no banco (guard `ActiveUserGuard`) versus quais confiam só no token.
