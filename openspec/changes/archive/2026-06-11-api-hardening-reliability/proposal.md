# Proposal: api-hardening-reliability

## Why

Uma revisão técnica do projeto identificou lacunas de confiabilidade e segurança que hoje passam despercebidas em dev, mas causam incidentes em produção: a aplicação não encerra conexões do Prisma de forma graciosa (causa direta do warning de "worker failed to exit" nos testes e2e), o health check não verifica nada (`check([])` retorna verde com o banco fora do ar), os endpoints de autenticação não têm rate limiting nem security headers, e há bugs de corretude conhecidos — a race condition de email duplicado vira HTTP 500 em vez de 409, e usuários com soft delete (`deleteAt` preenchido) continuam autenticando normalmente.

## What Changes

- Adicionar `OnModuleDestroy` ao `PrismaService` (`$disconnect()`) e habilitar `app.enableShutdownHooks()` no bootstrap
- Substituir `console.log` do bootstrap pelo `Logger` do NestJS
- Health check passa a verificar conectividade real com o banco (ping via Prisma)
- Adicionar `helmet` (security headers) e configuração explícita de CORS no bootstrap
- Adicionar rate limiting global com `@nestjs/throttler`, com limite mais restrito nos endpoints `sign-up`/`sign-in`
- Adicionar `MaxLength(72)` na senha (limite do bcrypt; evita DoS por custo de hash)
- Tratar erro `P2002` do Prisma em `UserService.create()` como `EmailAlreadyExistsException` (HTTP 409), eliminando o 500 da race condition TOCTOU
- Filtrar usuários com `deleteAt` preenchido em `readOneByEmail`/`readOneById` — usuário soft-deleted não autentica nem aparece no profile
- Corrigir tipagem de `AuthenticatedRequest` para estender `Request` do Express (hoje estende o `Request` global do fetch API)

## Capabilities

### New Capabilities

- `app-lifecycle`: encerramento gracioso da aplicação — desconexão do Prisma e shutdown hooks habilitados
- `health-check`: endpoint `/health` reflete o estado real das dependências (banco de dados)
- `api-security-hardening`: security headers, CORS explícito, rate limiting nos endpoints públicos e limites de entrada (senha)
- `user-account-integrity`: criação de usuário resiliente a corrida de email duplicado (409 consistente) e exclusão de usuários soft-deleted dos fluxos de leitura/autenticação

### Modified Capabilities

(nenhuma — os requirements existentes em `config-validation`, `tenant-table-provisioning`, `tenant-schema-safety` e `user-controller` permanecem válidos)

## Impact

- **Código**: `src/main.ts`, `src/modules/prisma/prisma.service.ts`, `src/modules/health/health.controller.ts` (+ módulo), `src/modules/user/user.service.ts`, `src/modules/user/dto/create-user.dto.ts`, `src/modules/auth/auth.controller.ts`, `src/modules/auth/interfaces/index.ts`, `src/app.module.ts`
- **Dependências novas**: `helmet`, `@nestjs/throttler`
- **APIs**: sem breaking changes de contrato; novos comportamentos: 409 em corrida de email, 401 para usuário soft-deleted, 429 sob rate limit
- **Testes**: novos casos unitários para P2002 e soft delete; e2e existentes devem continuar passando (o fix de lifecycle remove o warning de teardown)
