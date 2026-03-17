# Plano de Implementação: Melhorias Técnicas da Manager API

## Visão Geral

Implementação incremental das 24 melhorias técnicas, seguindo a ordem de prioridade do documento de requisitos: quick wins primeiro, depois médio prazo, e por fim longo prazo. Cada tarefa referencia requisitos e propriedades de corretude específicos.

## Tarefas

- [x] 1. Quick Wins — Limpeza e configurações rápidas
  - [x] 1.1 Remover dependências não utilizadas do package.json
    - Remover `@nestjs/typeorm`, `typeorm`, `sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3` e `serverless-http`
    - Verificar que o projeto compila sem erros após remoção
    - _Requisitos: 10.1, 10.2, 10.3_

  - [x] 1.2 Habilitar cache do ConfigModule
    - Adicionar `cache: true` no `ConfigModule.forRoot()` em `src/app.module.ts`
    - _Requisitos: 16.1, 16.2_

  - [x] 1.3 Implementar graceful shutdown do Prisma
    - Adicionar `OnModuleDestroy` ao `PrismaService` com `$disconnect()`
    - Adicionar `app.enableShutdownHooks()` em `src/main.ts`
    - _Requisitos: 8.1, 8.2, 8.3_

  - [x] 1.4 Remover fallbacks de variáveis sensíveis no loadConfig
    - Remover operadores `??` de `PORT`, `SALT`, `JWT_EXPIRES_IN`, `JWT_ISSUER`, `JWT_AUDIENCE` em `src/config/load.config.ts`
    - Adicionar `CORS_ORIGINS` à configuração e validação
    - Atualizar `.env.example` com `CORS_ORIGINS` e `DATABASE_URL`
    - _Requisitos: 20.1, 20.2, 20.3_

  - [ ]* 1.5 Escrever property test para validação de variáveis de ambiente
    - **Property 14: Variáveis de ambiente obrigatórias causam falha na ausência**
    - **Valida: Requisitos 20.1, 20.2**

  - [x] 1.6 Configurar Helmet para headers de segurança
    - Instalar `helmet` e `@types/helmet`
    - Adicionar `app.use(helmet())` em `src/main.ts`
    - _Requisitos: 2.1, 2.2_

  - [x] 1.7 Desabilitar Swagger em produção
    - Envolver configuração do Swagger com condicional `NODE_ENV !== 'production'` em `src/main.ts`
    - _Requisitos: 21.1, 21.2, 21.3_

  - [x] 1.8 Implementar health check com verificação de banco de dados
    - Criar `PrismaHealthIndicator` em `src/modules/health/`
    - Executar `$queryRaw(SELECT 1)` com medição de tempo de resposta
    - Registrar no `HealthController`
    - _Requisitos: 9.1, 9.2, 9.3_

- [x] 2. Checkpoint — Verificar quick wins
  - Garantir que o projeto compila e inicia sem erros. Perguntar ao usuário se há dúvidas.

- [x] 3. Segurança — CORS e Rate Limiting
  - [x] 3.1 Configurar CORS com origens de variáveis de ambiente
    - Ler `CORS_ORIGINS` do ConfigService, fazer split por vírgula e trim
    - Configurar `app.enableCors()` em `src/main.ts` com origens, métodos e `credentials: true`
    - _Requisitos: 1.1, 1.2, 1.3_

  - [ ]* 3.2 Escrever property test para parsing de origens CORS
    - **Property 1: Parsing de origens CORS**
    - **Valida: Requisitos 1.1**

  - [x] 3.3 Implementar rate limiting com @nestjs/throttler
    - Instalar `@nestjs/throttler`
    - Configurar `ThrottlerModule.forRoot()` no `AppModule` com limites default e auth
    - Registrar `ThrottlerGuard` como `APP_GUARD` global
    - Aplicar `@Throttle` mais restritivo nas rotas `sign-in` e `sign-up`
    - Customizar mensagem 429 em pt-BR no GlobalExceptionFilter
    - _Requisitos: 3.1, 3.2, 3.3_

- [x] 4. Arquitetura — Exception Filter e Logging
  - [x] 4.1 Criar Global Exception Filter
    - Criar `src/common/filters/global-exception.filter.ts` com `@Catch()`
    - Tratar `HttpException` retornando `statusCode`, `message`, `error`, `timestamp`
    - Tratar exceções não-HTTP retornando 500 com mensagem genérica em pt-BR
    - Registrar via `APP_FILTER` no `AppModule`
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 4.2 Escrever property test para Global Exception Filter
    - **Property 5: Global Exception Filter formata exceções HTTP**
    - **Valida: Requisitos 6.1, 6.2**

  - [x] 4.3 Implementar logging estruturado com Pino
    - Instalar `nestjs-pino` e `pino-pretty` (dev)
    - Configurar `LoggerModule.forRoot()` no `AppModule`
    - Substituir `console.log` em `main.ts` pelo Logger do NestJS
    - Integrar logging no GlobalExceptionFilter para stack traces
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_

- [ ] 5. Segurança e Qualidade — Validação e Soft Delete
  - [ ] 5.1 Fortalecer validação de senha com regex de complexidade
    - Substituir `@MinLength(6)` por `@Matches` com regex `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$` em `CreateUserDto`
    - Atualizar mensagem de erro em pt-BR
    - _Requisitos: 4.1, 4.2, 4.3_

  - [ ]* 5.2 Escrever property test para validação de complexidade de senha
    - **Property 4: Validação de complexidade de senha**
    - **Valida: Requisitos 4.1**

  - [ ] 5.3 Implementar soft delete consistente no UserService
    - Adicionar `deleteAt: null` em todas as cláusulas `where` de leitura (`readOneByEmail`, `readOneById`, `create` check)
    - Implementar método `softDelete(id)` que preenche `deleteAt` com data atual
    - Garantir que login de usuário soft-deleted lança `UserUnauthorizedException`
    - _Requisitos: 11.1, 11.2, 11.3_

  - [ ]* 5.4 Escrever property test para soft delete
    - **Property 7: Soft delete exclui usuário das consultas de leitura**
    - **Valida: Requisitos 11.1, 11.3**

- [ ] 6. Checkpoint — Verificar segurança e qualidade
  - Garantir que todos os testes passam. Perguntar ao usuário se há dúvidas.

- [ ] 7. Testes Unitários dos Services
  - [ ] 7.1 Criar testes unitários do UserService
    - Criar `src/modules/user/user.service.spec.ts`
    - Testar: criação com sucesso, e-mail duplicado → exceção, busca por ID OK, ID inexistente → exceção, softDelete OK
    - Mockar PrismaService
    - _Requisitos: 12.1, 12.3_

  - [ ] 7.2 Criar testes unitários do AuthService
    - Criar `src/modules/auth/auth.service.spec.ts`
    - Testar: registro OK, login OK, senha inválida → exceção, e-mail inexistente → exceção, soft-deleted user → exceção
    - Mockar UserService e JwtService
    - _Requisitos: 12.1, 12.2_

  - [ ] 7.3 Instalar fast-check e criar testes unitários do GlobalExceptionFilter
    - Instalar `fast-check` como devDependency
    - Criar `src/common/filters/global-exception.filter.spec.ts`
    - Testar: HttpException → formato correto, Error genérico → 500, ValidationError → 400
    - _Requisitos: 12.1_

- [ ] 8. Performance e Índices
  - [ ] 8.1 Adicionar índices no schema Prisma
    - Adicionar `@@index([email, deleteAt])` e `@@index([createAt])` no modelo User
    - Gerar migration
    - _Requisitos: 15.1, 15.2, 15.3_

  - [ ] 8.2 Configurar path aliases no TypeScript
    - Adicionar `paths` no `tsconfig.json`: `@modules/*`, `@config/*`, `@generated/*`, `@common/*`
    - Configurar `moduleNameMapper` no Jest (package.json e jest-e2e.json)
    - Atualizar imports existentes para usar aliases
    - _Requisitos: 22.1, 22.2, 22.3_

- [ ] 9. Strict TypeScript
  - [ ] 9.1 Ativar strict mode no TypeScript e ESLint
    - Configurar `noImplicitAny: true` e `strictBindCallApply: true` no `tsconfig.json`
    - Alterar `@typescript-eslint/no-explicit-any` de `off` para `error` no `eslint.config.mjs`
    - Corrigir todos os erros de tipagem resultantes no código-fonte
    - _Requisitos: 5.1, 5.2, 5.3_

- [ ] 10. Checkpoint — Verificar performance e tipagem
  - Garantir que todos os testes passam e o lint não reporta erros. Perguntar ao usuário se há dúvidas.

- [ ] 11. Repository Pattern
  - [ ] 11.1 Criar interface IUserRepository e implementação UserRepository
    - Criar `src/modules/user/interfaces/user-repository.interface.ts` com métodos: `create`, `findByEmail`, `findById`, `softDelete`, `findMany`, `count`
    - Criar `src/modules/user/user.repository.ts` implementando `IUserRepository` com PrismaService
    - Registrar no `UserModule` com token `USER_REPOSITORY` e `useClass: UserRepository`
    - _Requisitos: 17.1, 17.2, 17.3_

  - [ ] 11.2 Refatorar UserService para usar IUserRepository
    - Substituir injeção direta de `PrismaService` por `IUserRepository` via `@Inject('USER_REPOSITORY')`
    - Atualizar testes unitários do UserService para mockar `IUserRepository`
    - _Requisitos: 17.2, 17.3_

- [ ] 12. Refresh Token
  - [ ] 12.1 Criar modelo RefreshToken no Prisma e migrar
    - Adicionar modelo `RefreshToken` no `schema.prisma` com campos: `id`, `tokenHash`, `userId`, `expiresAt`, `createAt`
    - Adicionar relação `refreshTokens` no modelo `User`
    - Adicionar índices em `userId` e `tokenHash`
    - Gerar e aplicar migration
    - _Requisitos: 18.4_

  - [ ] 12.2 Implementar lógica de refresh token no AuthService
    - Criar `RefreshTokenDto` em `src/modules/auth/dto/`
    - Criar `InvalidRefreshTokenException` em `src/modules/auth/errors/`
    - Atualizar `AuthResponseDto` para incluir campo `refreshToken`
    - Gerar refresh token com uuid, hashear com bcrypt, salvar no banco
    - Implementar método `refresh()` que valida hash e emite novo access token
    - Configurar expiração do access token para 15min e refresh token para 7 dias
    - _Requisitos: 18.1, 18.2, 18.3, 18.4_

  - [ ] 12.3 Criar endpoint POST /auth/refresh
    - Adicionar rota `refresh` no `AuthController`
    - Documentar no Swagger
    - _Requisitos: 18.2, 18.3_

  - [ ]* 12.4 Escrever property test para hash de refresh token
    - **Property 13: Refresh tokens são armazenados como hash**
    - **Valida: Requisitos 18.4**

- [ ] 13. Versionamento de API
  - [ ] 13.1 Configurar versionamento URI no NestJS
    - Adicionar `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` em `src/main.ts`
    - Atualizar controllers existentes com `@Controller({ version: '1', path: '...' })`
    - Atualizar documentação Swagger com versão
    - _Requisitos: 19.1, 19.2, 19.3_

- [ ] 14. Paginação
  - [ ] 14.1 Criar DTOs de paginação
    - Criar `src/common/dto/pagination-query.dto.ts` com `page` (min:1, default:1) e `limit` (min:1, max:100, default:10)
    - Criar `src/common/dto/paginated-response.dto.ts` com `data`, `total`, `page`, `totalPages`
    - _Requisitos: 14.1, 14.3_

  - [ ] 14.2 Implementar método findAll paginado no UserService/Repository
    - Adicionar `findMany` e `count` no `IUserRepository` e `UserRepository`
    - Implementar `findAll(query: PaginationQueryDto)` no `UserService`
    - _Requisitos: 14.1, 14.2_

  - [ ]* 14.3 Escrever property tests para paginação
    - **Property 8: Paginação retorna dados consistentes**
    - **Property 9: Validação de parâmetros de paginação**
    - **Valida: Requisitos 14.1, 14.2, 14.3**

- [ ] 15. Checkpoint — Verificar features estruturais
  - Garantir que todos os testes passam. Perguntar ao usuário se há dúvidas.

- [ ] 16. Testes E2E
  - [ ] 16.1 Atualizar testes e2e com fluxos reais
    - Atualizar `test/app.e2e-spec.ts` ou criar `test/auth.e2e-spec.ts`
    - Testar fluxo completo: sign-up → sign-in → profile com token
    - Testar erros: credenciais inválidas, token ausente, e-mail duplicado
    - Testar refresh token flow
    - Configurar banco de teste isolado
    - _Requisitos: 13.1, 13.2, 13.3_

  - [ ]* 16.2 Criar teste e2e para health check e headers de segurança
    - Criar `test/health.e2e-spec.ts`
    - Verificar que health check retorna status do DB
    - Verificar presença de headers de segurança do Helmet
    - _Requisitos: 2.2, 9.1_

- [ ] 17. DevOps — Docker Compose e CI
  - [ ] 17.1 Criar docker-compose.yml para PostgreSQL
    - Criar `docker-compose.yml` com serviço PostgreSQL 17-alpine
    - Configurar variáveis de ambiente, porta e volume persistente
    - _Requisitos: 23.1, 23.2, 23.3_

  - [ ] 17.2 Criar pipeline de CI com GitHub Actions
    - Criar `.github/workflows/ci.yml`
    - Configurar steps: checkout, setup Node 22, cache Yarn, install, lint, build, test
    - Executar em push e pull request
    - _Requisitos: 24.1, 24.2, 24.3_

- [ ] 18. Checkpoint final — Validação completa
  - Garantir que todos os testes passam, lint está limpo e build compila sem erros. Perguntar ao usuário se há dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Property tests validam propriedades universais de corretude com `fast-check`
- Testes unitários validam cenários específicos e edge cases
