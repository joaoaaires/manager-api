## Context

`manager-api` é uma API NestJS multi-tenant com autenticação JWT. O estado atual apresenta:
- `UserModule` não está listado em `AppModule.imports`, sendo carregado apenas transitivamente via `AuthModule` — frágil e não-intencional
- `AuthController` agrega responsabilidades de autenticação e perfil de usuário (`GET /profile`), violando SRP
- `UserService.create()` executa três operações sequenciais sem atomicidade garantida: (1) check de email, (2) DDL de schema, (3) INSERT de usuário — race condition possível entre (1) e (3)
- `$executeRawUnsafe` recebe `tenantName` derivado de `randomBytes`, que hoje é seguro, mas sem validação explícita fica frágil para futuras mudanças
- 6 dependências presentes em `package.json` sem uso real: `@nestjs/typeorm`, `typeorm`, `sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3`, `dotenv`
- Campos `createAt`/`updateAt` no schema Prisma são nomes inconsistentes com a convenção `createdAt`/`updatedAt` usada pela comunidade
- Sem testes unitários para serviços críticos

## Goals / Non-Goals

**Goals:**
- Tornar a dependência entre módulos explícita e registrada em `AppModule`
- Separar responsabilidades de `AuthController`: autenticação fica em `AuthController`, perfil em `UserController`
- Adicionar validação de `tenant_name` antes de qualquer DDL raw
- Corrigir o fluxo de rollback em `UserService.create()` para cobrir falha no `prisma.user.create()`
- Renomear campos de data no schema Prisma para `createdAt`/`updatedAt`
- Remover dependências mortas
- Adicionar testes unitários para `UserService` e `AuthService`

**Non-Goals:**
- Substituir DDL raw por sistema de migrações por-tenant (escopo futuro)
- Implementar rate limiting ou throttling
- Adicionar novos endpoints de usuário (CRUD completo)
- Refatorar sistema de configuração

## Decisions

### D1 — Separar `UserController` de `AuthController`

O endpoint `GET /profile` pertence ao domínio de usuário, não de autenticação. Criar `UserController` dentro de `UserModule` mantém cada módulo coeso. `AuthController` passa a conter apenas `sign-up` e `sign-in`.

**Alternativa considerada**: manter tudo em `AuthController` e documentar como "auth-related profile". Rejeitado: dificulta expansão futura (ex: `PATCH /profile`, `DELETE /profile`).

### D2 — Registrar `UserModule` explicitamente em `AppModule`

`AppModule` deve declarar todos os módulos de feature de forma explícita. O import transitivo atual (via `AuthModule`) mascara a dependência real e pode causar problemas de ordem de inicialização.

### D3 — Validar `tenant_name` com regex antes do DDL

Adicionar validação `^[a-z_][a-z0-9_]{0,62}$` no `TenantProvisioningService` antes de qualquer `$executeRawUnsafe`. Isso é uma camada de defesa extra — o nome hoje já vem de `randomBytes`, mas a validação documenta o contrato e protege contra mudanças futuras.

**Alternativa considerada**: usar `pg.escapeIdentifier()` antes do DDL. Válido, mas requer expor a conexão pg fora do Prisma. A validação por regex é mais simples e suficiente para nomes gerados internamente.

### D4 — Estender o rollback para cobrir falha no `user.create()`

O código atual só faz `DROP SCHEMA` se o DDL de provisionamento falhar. Se `prisma.user.create()` falhar (ex: constraint de email violada por race condition), o schema fica órfão. O `try/catch` deve envolver todo o bloco pós-criação de schema.

**Alternativa considerada**: usar transação Prisma com `$transaction`. Não aplicável pois DDL não pode ser incluído em transações PostgreSQL da mesma forma — o `CREATE SCHEMA` tem commit implícito.

### D5 — Renomear campos de data: migration com `@map`

Renomear `createAt`→`createdAt` e `updateAt`→`updatedAt` no schema Prisma. Gerar migration. Atualizar todos os DTOs e referências. Usar `@map` se necessário para manter compatibilidade de coluna no banco.

### D6 — Remover dependências não utilizadas

Remoção simples via `npm uninstall`. Nenhuma refatoração de código necessária.

## Risks / Trade-offs

- **[Renomear campos de data é BREAKING]** → Qualquer client que consuma `createAt`/`updateAt` precisa ser atualizado. Mitigação: documentar no changelog, fazer em janela de manutenção se houver clients externos.
- **[Race condition em email check + create persiste]** → A correção do rollback não elimina o TOCTOU entre `findUnique` e `user.create()`. Mitigação: a constraint `UNIQUE` no banco garante consistência; o erro será surfaced como `EmailAlreadyExistsException` via tratamento do `P2002` do Prisma se adicionado.
- **[Tests unitários precisam mockar Prisma]** → Usar `jest.mock` no nível do módulo ou criar um `PrismaService` mock manual. Alternativa: `jest-mock-extended` (não adicionar dependência nova; usar mock manual).

## Migration Plan

1. Remover dependências mortas (`npm uninstall`)
2. Renomear campos no `schema.prisma` → `npx prisma migrate dev --name rename-timestamps`
3. Atualizar DTOs e todas as referências a `createAt`/`updateAt`
4. Criar `UserController` em `UserModule`, mover `GET /profile` + guard
5. Remover `UserService` do `AuthController`; ajustar imports
6. Registrar `UserModule` em `AppModule.imports`
7. Adicionar validação de `tenant_name` em `TenantProvisioningService`
8. Corrigir bloco try/catch em `UserService.create()`
9. Adicionar `user.service.spec.ts` e `auth.service.spec.ts`
10. Executar `npm test` e `npm run test:e2e` para validar

**Rollback**: cada passo é incremental e reversível via `git revert`. A migration de rename de campos é o único passo que requer `prisma migrate reset` em dev para desfazer.

## Open Questions

- Há clients externos (mobile app, frontend) consumindo `createAt`/`updateAt`? Se sim, coordenar o breaking change.
- O endpoint `GET /profile` deve ser versionado (`/v1/profile`) para facilitar futuras mudanças sem breaking change?
