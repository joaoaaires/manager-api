## 1. Limpeza de Dependências

- [x] 1.1 Remover `@nestjs/typeorm` e `typeorm` do `package.json` e `node_modules`
- [x] 1.2 Remover `sqlite3`, `@prisma/adapter-better-sqlite3` e `@types/better-sqlite3` do `package.json`
- [x] 1.3 Mover `dotenv` de `dependencies` para `devDependencies` (necessário apenas para Prisma CLI via `prisma.config.ts`)
- [x] 1.4 Executar `npm install` e verificar que build continua passando

## 2. Renomear Campos de Timestamp no Schema Prisma

- [x] 2.1 Atualizar `schema.prisma`: renomear `createAt` → `createdAt` e `updateAt` → `updatedAt` no model `User`
- [x] 2.2 Executar `npx prisma migrate dev --name rename-timestamps` para gerar a migration
- [x] 2.3 Executar `npx prisma generate` para atualizar o client gerado
- [x] 2.4 Atualizar `UserResponseDto`: renomear campos `createAt`/`updateAt` para `createdAt`/`updatedAt`
- [x] 2.5 Atualizar `AuthResponseDto`: renomear campos `createAt`/`updateAt` para `createdAt`/`updatedAt`

## 3. Segurança do Schema Tenant

- [x] 3.1 Adicionar validação `^[a-z_][a-z0-9_]{0,62}$` no início de `TenantProvisioningService.provisionTenant()`, lançando `BadRequestException` em caso de falha
- [x] 3.2 Refatorar `UserService.create()`: envolver todo o bloco pós-criação de schema (provisionamento + `prisma.user.create()`) em um único `try/catch` com `DROP SCHEMA IF EXISTS ... CASCADE` no `catch`

## 4. Reorganização de Módulos e Controllers

- [x] 4.1 Criar `src/modules/user/user.controller.ts` com o endpoint `GET /profile` (movido de `AuthController`), protegido por `AuthGuard`
- [x] 4.2 Registrar `UserController` em `UserModule.controllers`
- [x] 4.3 Remover o endpoint `GET /profile` de `AuthController` e remover a injeção de `UserService` do `AuthController`
- [x] 4.4 Adicionar `UserModule` explicitamente em `AppModule.imports`
- [x] 4.5 Verificar que `UserModule` ainda exporta `UserService` para uso pelo `AuthModule`

## 5. Testes Unitários

- [x] 5.1 Criar `src/modules/user/user.service.spec.ts` com mocks de `PrismaService`, `ConfigService` e `TenantProvisioningService`; cobrir: criação com sucesso, email duplicado, rollback de schema em falha
- [x] 5.2 Criar `src/modules/auth/auth.service.spec.ts` com mocks de `UserService` e `JwtService`; cobrir: register, access com senha válida, access com senha inválida
- [x] 5.3 Executar `npm test` e garantir que todos os testes passam

## 6. Validação Final

- [x] 6.1 Executar `npm run build` para verificar ausência de erros de TypeScript
- [x] 6.2 Executar `npm run lint` e corrigir eventuais avisos
- [x] 6.3 Executar `npm run test:e2e` para garantir que os testes end-to-end continuam passando
