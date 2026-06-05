## Why

O projeto está funcional, mas apresenta problemas de organização de módulos, riscos de segurança em operações DDL raw, dependências não utilizadas que inflam o bundle, e ausência de cobertura de testes unitários — dívidas que vão crescer à medida que o produto evolui.

## What Changes

- Corrigir a estrutura de módulos: `UserModule` ausente no `AppModule`, `ProfileController` (endpoint `/profile`) separado do `AuthController`
- Eliminar risco de SQL injection na criação de tenant schemas (validação estrita do `tenant_name` antes do DDL raw)
- Tornar a criação de usuário+schema atômica com rollback confiável
- Remover dependências não utilizadas: `@nestjs/typeorm`, `typeorm`, `sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3`, `dotenv`
- Adicionar testes unitários para `UserService` e `AuthService`
- Padronizar nomenclatura de campos no schema Prisma (`createAt`/`updateAt` → `createdAt`/`updatedAt`) **BREAKING**
- Expor `UserModule` diretamente no `AppModule` em vez de depender de importação transitiva via `AuthModule`

## Capabilities

### New Capabilities

- `user-controller`: Endpoint `GET /profile` e futuros endpoints de usuário movidos para um `UserController` dedicado, desacoplando responsabilidades do `AuthController`
- `tenant-schema-safety`: Validação e sanitização do nome do schema de tenant antes de qualquer operação DDL raw, com garantia de rollback correto em falha de provisionamento

### Modified Capabilities

<!-- Nenhuma spec existente identificada em openspec/specs/ -->

## Impact

- **Módulos**: `AppModule`, `AuthModule`, `UserModule` — reorganização de imports e providers
- **Controllers**: `AuthController` perde endpoint `/profile`; novo `UserController` criado
- **Services**: `UserService.create()` — lógica de rollback revisada; validação de `tenant_name` adicionada
- **Schema Prisma**: renomear `createAt`→`createdAt` e `updateAt`→`updatedAt` (migration necessária) **BREAKING**
- **DTOs**: `UserResponseDto` e `AuthResponseDto` — campos de data atualizados
- **package.json**: 6 dependências removidas
- **Testes**: novos arquivos `user.service.spec.ts` e `auth.service.spec.ts`
