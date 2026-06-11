## 1. Dependências

- [x] 1.1 Instalar `helmet` e `@nestjs/throttler` (`npm install helmet @nestjs/throttler`)

## 2. Lifecycle e Logging

- [x] 2.1 Implementar `OnModuleDestroy` em `PrismaService` chamando `this.$disconnect()`
- [x] 2.2 Chamar `app.enableShutdownHooks()` no `main.ts`
- [x] 2.3 Substituir `console.log` do bootstrap por `Logger` do NestJS com contexto `Bootstrap`

## 3. Health Check

- [x] 3.1 Importar `PrismaModule` em `HealthModule`
- [x] 3.2 Injetar `PrismaHealthIndicator` e `PrismaService` em `HealthController` e adicionar `pingCheck('database', prisma)` ao `health.check([...])`

## 4. Segurança HTTP

- [x] 4.1 Adicionar `app.use(helmet())` no bootstrap, antes das demais configurações
- [x] 4.2 Habilitar CORS com origem vinda de `CORS_ORIGIN` (default `*`): adicionar a chave em `load.config.ts` e usar `app.enableCors({ origin })`
- [x] 4.3 Registrar `ThrottlerModule.forRoot` em `AppModule` (limite global 100 req/60s) e `ThrottlerGuard` como `APP_GUARD`
- [x] 4.4 Aplicar `@Throttle({ default: { limit: 5, ttl: 60000 } })` nos handlers `sign-up` e `sign-in` do `AuthController`
- [x] 4.5 Adicionar `@MaxLength(72)` ao campo `password` de `CreateUserDto` com mensagem em português
- [x] 4.6 Verificar manualmente que `GET /docs` (Swagger UI) continua funcional com helmet habilitado

## 5. Integridade de Conta de Usuário

- [x] 5.1 Em `UserService.create()`, no `catch` existente: detectar `PrismaClientKnownRequestError` com `code === 'P2002'` e relançar `EmailAlreadyExistsException` após o `DROP SCHEMA`
- [x] 5.2 Alterar `readOneByEmail` e `readOneById` para `findFirst` com filtro `deleteAt: null`
- [x] 5.3 Corrigir `AuthenticatedRequest` em `src/modules/auth/interfaces/index.ts` para estender `Request` do Express

## 6. Testes

- [x] 6.1 Adicionar casos em `user.service.spec.ts`: P2002 vira `EmailAlreadyExistsException` (com rollback de schema) e `readOneByEmail`/`readOneById` não retornam usuário soft-deleted
- [x] 6.2 Executar `npm test` e garantir que todos os testes passam

## 7. Validação Final

- [x] 7.1 Executar `npm run build` sem erros de TypeScript
- [x] 7.2 Executar `npm run lint` e corrigir eventuais avisos
- [x] 7.3 Executar `npm run test:e2e` e confirmar que o warning de teardown ("worker failed to exit gracefully") desapareceu
