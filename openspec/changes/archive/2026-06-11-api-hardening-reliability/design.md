## Context

`manager-api` é uma API NestJS 11 multi-tenant (PostgreSQL + Prisma 7 com driver adapter `pg`) com autenticação JWT via Passport. Após a change `project-structure-performance` (módulos reorganizados, rollback de tenant corrigido, testes unitários adicionados), uma revisão técnica identificou lacunas de operação e segurança:

- `PrismaService` implementa apenas `OnModuleInit` (`$connect`); nunca chama `$disconnect()`. O `main.ts` não chama `app.enableShutdownHooks()`. Consequência observável: warning "worker process has failed to exit gracefully" no Jest e2e; em produção, conexões abandonadas a cada deploy.
- `HealthController` chama `this.health.check([])` — lista de indicadores vazia. O endpoint responde 200 mesmo com o banco indisponível.
- Bootstrap sem `helmet` e sem configuração de CORS; nenhum rate limiting — `POST /sign-in` executa `bcrypt.compare` por requisição, alvo barato de brute-force.
- `CreateUserDto.password` tem `MinLength(6)` mas não tem limite máximo; bcrypt trunca em 72 bytes e o custo de hash cresce com o tamanho da entrada.
- A race TOCTOU em `UserService.create()` (entre `findUnique` e `create`) é conhecida desde o design anterior: a constraint UNIQUE garante consistência, mas o erro `P2002` do Prisma sobe como 500 genérico em vez de 409.
- O model `User` tem `deleteAt` (soft delete), mas `readOneByEmail`/`readOneById` não filtram por ele — usuário "deletado" autentica e acessa o profile.
- `AuthenticatedRequest extends Request` em `auth/interfaces/index.ts` referencia o `Request` global do fetch API (não há import), não o do Express — tipagem incorreta que compila por coincidência estrutural.

## Goals / Non-Goals

**Goals:**
- Encerramento gracioso: Prisma desconecta no shutdown; shutdown hooks habilitados
- Health check refletindo o estado real do banco
- Baseline de segurança HTTP: helmet, CORS explícito, rate limiting com limite agressivo em auth
- Entrada de senha com limite máximo compatível com bcrypt
- `P2002` mapeado para `EmailAlreadyExistsException` (409)
- Usuários soft-deleted excluídos de leitura e autenticação
- Tipagem correta de `AuthenticatedRequest`

**Non-Goals:**
- Endpoint de soft delete de usuário (a coluna existe; o fluxo de deleção é escopo futuro)
- Refresh tokens, logout ou blacklist de JWT
- Observabilidade completa (métricas, tracing, request logging estruturado)
- Versionamento de API (`/v1`) — permanece em aberto da change anterior
- CI/CD

## Decisions

### D1 — Lifecycle: `OnModuleDestroy` no PrismaService + `enableShutdownHooks`

`PrismaService` passa a implementar `OnModuleDestroy` chamando `this.$disconnect()`, e o bootstrap chama `app.enableShutdownHooks()`. É o padrão documentado pelo próprio Prisma para NestJS.

**Alternativa considerada**: registrar `beforeExit` no process. Rejeitado: o hook do Nest cobre SIGTERM/SIGINT (deploy em containers) e integra com o teardown do `app.close()` usado nos testes.

### D2 — Health: `PrismaHealthIndicator` do Terminus

Usar o `PrismaHealthIndicator` nativo do `@nestjs/terminus` (já é dependência) com o `PrismaService` existente: `this.health.check([() => this.prismaHealth.pingCheck('database', this.prisma)])`. Requer importar `PrismaModule` no `HealthModule`.

**Alternativa considerada**: indicador custom com `SELECT 1` via `$queryRaw`. Desnecessário — o Terminus já suporta Prisma.

### D3 — Rate limiting: `@nestjs/throttler` global com override em auth

`ThrottlerModule.forRoot` com limite global generoso (ex.: 100 req/60s por IP) e `ThrottlerGuard` como `APP_GUARD`. Nos handlers `sign-up`/`sign-in`, `@Throttle` com limite restrito (ex.: 5 req/60s). Limites configuráveis viriam de env em iteração futura; nesta change ficam constantes no código.

**Alternativa considerada**: rate limiting apenas em auth, sem guard global. Rejeitado: o guard global protege também endpoints futuros por padrão (secure by default), e o custo é um decorator de exceção onde não se aplica.

### D4 — Segurança HTTP: helmet com defaults + CORS explícito

`app.use(helmet())` com configuração padrão e `app.enableCors()` com origem configurável (`CORS_ORIGIN` em env, default `*` em dev). Helmet entra antes de qualquer rota.

### D5 — `P2002` → `EmailAlreadyExistsException`

No `catch` existente de `UserService.create()` (que já faz o `DROP SCHEMA`), inspecionar o erro: se for `PrismaClientKnownRequestError` com `code === 'P2002'`, relançar `EmailAlreadyExistsException` em vez do erro cru. O check otimista `findUnique` permanece como fast path.

**Alternativa considerada**: remover o `findUnique` e confiar só na constraint. Rejeitado: o fast path evita criar schema/provisionar tenant à toa no caso comum de email duplicado.

### D6 — Soft delete: filtro `deleteAt: null` nas leituras

`readOneByEmail` e `readOneById` passam a usar `findFirst` com `where: { ..., deleteAt: null }` (o `findUnique` não aceita campos não-únicos no where). Usuário soft-deleted resulta em `UserNotFoundException`, que nos fluxos de auth vira 401/404 — sem vazar a existência da conta.

**Alternativa considerada**: extensão global do Prisma Client (`$extends`) filtrando `deleteAt` em todas as queries do model. Mais robusto, porém invasivo demais para duas queries; adotar quando houver mais models com soft delete.

### D7 — Tipagem: `AuthenticatedRequest extends ExpressRequest`

Importar `Request` de `express` e estender dele. Zero impacto em runtime; corrige autocomplete e checagem de tipos.

## Risks / Trade-offs

- **[Rate limit pode atingir usuários legítimos atrás de NAT/proxy]** → Limites iniciais conservadores; em produção atrás de proxy, configurar `trust proxy` para o throttler ver o IP real (documentado como follow-up).
- **[helmet pode quebrar o Swagger UI (CSP)]** → Validar `/docs` após habilitar; se necessário, ajustar `contentSecurityPolicy` apenas para a rota de docs.
- **[`findFirst` perde a garantia de índice do `findUnique`]** → As queries continuam usando as colunas únicas (`email`, `id`) no `where`; o planner usa o índice único normalmente.
- **[Throttler adiciona dependência nova]** → `@nestjs/throttler` é mantido pelo core team do NestJS; risco baixo.
- **[Testes e2e de rate limit podem ficar flaky]** → Testar 429 apenas em teste unitário/isolado do guard ou com limites injetados; e2e existentes não disparam o limite global.

## Migration Plan

1. `npm install helmet @nestjs/throttler`
2. PrismaService (`OnModuleDestroy`) + `enableShutdownHooks` + `Logger` no bootstrap
3. Health check com `PrismaHealthIndicator`
4. helmet + CORS no bootstrap
5. ThrottlerModule global + `@Throttle` em auth
6. `MaxLength(72)` na senha
7. `P2002` → 409 no `UserService.create()`
8. Filtro `deleteAt: null` em `readOneByEmail`/`readOneById`
9. Fix de tipagem `AuthenticatedRequest`
10. Atualizar/criar testes unitários; rodar `npm test`, `npm run build`, `npm run lint`, `npm run test:e2e`

**Rollback**: todos os passos são reversíveis via `git revert`; nenhuma migration de banco envolvida.

## Open Questions

- Quais limites de rate (global e auth) usar em produção? Os valores iniciais (100/60s e 5/60s) são chute conservador — confirmar com o uso real.
- `CORS_ORIGIN` deve ser obrigatório em produção (falhar o boot sem ele) ou default `*` é aceitável por ora?
