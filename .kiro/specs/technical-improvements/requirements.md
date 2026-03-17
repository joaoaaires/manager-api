# Documento de Requisitos — Melhorias Técnicas da Manager API

## Introdução

Este documento especifica os requisitos de melhoria técnica para a Manager API, uma API REST NestJS 11 para autenticação e gerenciamento de usuários. A análise abrange 10 dimensões: arquitetura, organização, qualidade de código, escalabilidade, segurança, performance, design patterns, problemas em produção, experiência do desenvolvedor e ferramentas/tecnologias. Cada requisito descreve um problema encontrado, seu impacto e a melhoria proposta.

## Glossário

- **Manager_API**: A aplicação NestJS REST API para autenticação e gerenciamento de usuários
- **AuthModule**: Módulo responsável por registro, login e validação JWT
- **UserModule**: Módulo responsável pela lógica de domínio de usuários
- **PrismaModule**: Módulo global que fornece acesso ao banco de dados PostgreSQL via Prisma ORM
- **HealthModule**: Módulo de verificação de saúde da aplicação
- **ValidationPipe**: Pipe global do NestJS que valida DTOs de entrada
- **AuthGuard**: Guard que protege rotas autenticadas via JWT/Passport
- **DTO**: Data Transfer Object — classe usada para validação de entrada ou serialização de resposta
- **JWT**: JSON Web Token — token de autenticação
- **CORS**: Cross-Origin Resource Sharing — mecanismo de segurança para requisições entre origens
- **Rate_Limiter**: Mecanismo de limitação de taxa de requisições por cliente
- **Helmet**: Middleware que configura headers HTTP de segurança
- **Soft_Delete**: Padrão de exclusão lógica onde registros são marcados como deletados sem remoção física
- **Global_Exception_Filter**: Filtro centralizado que captura e formata todas as exceções da aplicação
- **Logging_Service**: Serviço centralizado de registro de logs estruturados
- **CI_Pipeline**: Pipeline de integração contínua para build, lint, testes e deploy automatizados

## Requisitos

### Requisito 1: Segurança — Configuração de CORS

**User Story:** Como desenvolvedor, quero que a API tenha CORS configurado explicitamente, para que apenas origens autorizadas possam fazer requisições.

#### Critérios de Aceitação

1. THE Manager_API SHALL configurar CORS com uma lista explícita de origens permitidas lida de variáveis de ambiente
2. WHEN uma requisição de origem não autorizada for recebida, THE Manager_API SHALL rejeitar a requisição com status HTTP 403
3. WHILE em ambiente de desenvolvimento, THE Manager_API SHALL permitir origens localhost configuráveis

---

### Requisito 2: Segurança — Headers HTTP com Helmet

**User Story:** Como desenvolvedor, quero que a API utilize Helmet para configurar headers HTTP de segurança, para que a aplicação esteja protegida contra ataques comuns.

#### Critérios de Aceitação

1. THE Manager_API SHALL utilizar o middleware Helmet para configurar headers de segurança HTTP em todas as respostas
2. WHEN uma resposta for enviada, THE Manager_API SHALL incluir os headers Content-Security-Policy, X-Content-Type-Options, X-Frame-Options e Strict-Transport-Security

---

### Requisito 3: Segurança — Rate Limiting

**User Story:** Como desenvolvedor, quero que a API tenha limitação de taxa de requisições, para que esteja protegida contra ataques de força bruta e abuso.

#### Critérios de Aceitação

1. THE Manager_API SHALL limitar o número de requisições por IP dentro de uma janela de tempo configurável via variáveis de ambiente
2. WHEN o limite de requisições for excedido, THE Manager_API SHALL retornar status HTTP 429 com uma mensagem descritiva em pt-BR
3. THE Manager_API SHALL aplicar um limite mais restritivo nas rotas de autenticação (sign-in e sign-up)

---

### Requisito 4: Segurança — Fortalecimento da Validação de Senha

**User Story:** Como desenvolvedor, quero que a validação de senha exija critérios de complexidade, para que as contas dos usuários estejam mais protegidas.

#### Critérios de Aceitação

1. THE ValidationPipe SHALL exigir que senhas tenham no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula e um número
2. WHEN uma senha não atender aos critérios de complexidade, THE ValidationPipe SHALL retornar uma mensagem de erro descritiva em pt-BR indicando os critérios não atendidos
3. THE Manager_API SHALL utilizar o decorator @Matches do class-validator com regex de complexidade no DTO de criação de usuário

---

### Requisito 5: Segurança — Ativação de Strict Mode no TypeScript

**User Story:** Como desenvolvedor, quero que o TypeScript esteja configurado com `noImplicitAny: true` e `strictBindCallApply: true`, para que o código tenha tipagem mais segura e menos bugs em tempo de execução.

#### Critérios de Aceitação

1. THE Manager_API SHALL configurar `noImplicitAny` como `true` no tsconfig.json
2. THE Manager_API SHALL configurar `strictBindCallApply` como `true` no tsconfig.json
3. THE Manager_API SHALL desabilitar a regra ESLint `@typescript-eslint/no-explicit-any` como `error` em vez de `off`

---

### Requisito 6: Arquitetura — Filtro Global de Exceções

**User Story:** Como desenvolvedor, quero um filtro global de exceções padronizado, para que todas as respostas de erro sigam um formato consistente e previsível.

#### Critérios de Aceitação

1. THE Manager_API SHALL implementar um Global_Exception_Filter que capture todas as exceções não tratadas
2. WHEN uma exceção HTTP for lançada, THE Global_Exception_Filter SHALL retornar uma resposta JSON com os campos `statusCode`, `message`, `error` e `timestamp`
3. WHEN uma exceção não-HTTP inesperada ocorrer, THE Global_Exception_Filter SHALL retornar status 500 com mensagem genérica em pt-BR e registrar o stack trace no log
4. THE Global_Exception_Filter SHALL ser registrado globalmente via `APP_FILTER` provider no AppModule

---

### Requisito 7: Arquitetura — Logging Estruturado

**User Story:** Como desenvolvedor, quero um sistema de logging estruturado, para que os logs sejam pesquisáveis e úteis em ambientes de produção.

#### Critérios de Aceitação

1. THE Manager_API SHALL substituir `console.log` por um Logging_Service baseado no Logger do NestJS ou em uma biblioteca como Pino
2. THE Logging_Service SHALL produzir logs em formato JSON em ambiente de produção
3. WHEN uma requisição HTTP for recebida, THE Logging_Service SHALL registrar o método, URL, status code e tempo de resposta
4. WHEN uma exceção ocorrer, THE Logging_Service SHALL registrar o stack trace, o request ID e o contexto do módulo

---

### Requisito 8: Arquitetura — Graceful Shutdown do Prisma

**User Story:** Como desenvolvedor, quero que o PrismaService implemente `OnModuleDestroy` para desconectar do banco ao encerrar a aplicação, para que conexões não fiquem abertas.

#### Critérios de Aceitação

1. THE PrismaService SHALL implementar a interface `OnModuleDestroy` do NestJS
2. WHEN a aplicação for encerrada, THE PrismaService SHALL chamar `$disconnect()` para fechar todas as conexões com o banco de dados
3. THE Manager_API SHALL habilitar `enableShutdownHooks()` no bootstrap da aplicação

---

### Requisito 9: Arquitetura — Health Check com Verificação de Banco de Dados

**User Story:** Como desenvolvedor, quero que o health check verifique a conectividade com o banco de dados, para que o monitoramento detecte problemas de infraestrutura.

#### Critérios de Aceitação

1. THE HealthModule SHALL incluir um indicador de saúde do banco de dados PostgreSQL usando Prisma
2. WHEN o banco de dados estiver inacessível, THE HealthModule SHALL retornar status `down` com detalhes do erro
3. WHEN o banco de dados estiver acessível, THE HealthModule SHALL retornar status `up` com o tempo de resposta da verificação

---

### Requisito 10: Qualidade de Código — Remoção de Dependências Não Utilizadas

**User Story:** Como desenvolvedor, quero que o projeto não contenha dependências desnecessárias no package.json, para que o bundle seja menor e não haja confusão sobre o stack utilizado.

#### Critérios de Aceitação

1. THE Manager_API SHALL remover as dependências `@nestjs/typeorm`, `typeorm`, `sqlite3`, `@prisma/adapter-better-sqlite3`, `@types/better-sqlite3` e `serverless-http` do package.json
2. WHEN o comando `yarn install` for executado após a remoção, THE Manager_API SHALL compilar e iniciar sem erros
3. THE Manager_API SHALL manter apenas dependências efetivamente utilizadas no código-fonte

---

### Requisito 11: Qualidade de Código — Soft Delete Consistente

**User Story:** Como desenvolvedor, quero que o campo `deleteAt` do modelo User seja utilizado consistentemente nas queries, para que usuários deletados logicamente não apareçam em consultas normais.

#### Critérios de Aceitação

1. THE UserService SHALL filtrar registros com `deleteAt` não-nulo em todas as consultas de leitura (readOneByEmail, readOneById)
2. WHEN um usuário com `deleteAt` preenchido tentar fazer login, THE AuthService SHALL lançar UserUnauthorizedException
3. THE UserService SHALL implementar um método `softDelete` que preencha o campo `deleteAt` com a data atual em vez de remover o registro

---

### Requisito 12: Qualidade de Código — Testes Unitários para Services

**User Story:** Como desenvolvedor, quero testes unitários para AuthService e UserService, para que a lógica de negócio seja verificada automaticamente.

#### Critérios de Aceitação

1. THE Manager_API SHALL ter arquivos de teste `auth.service.spec.ts` e `user.service.spec.ts` no diretório de cada módulo
2. THE AuthService SHALL ter testes que verifiquem: registro com sucesso, login com sucesso, login com senha inválida lançando exceção, e login com e-mail inexistente lançando exceção
3. THE UserService SHALL ter testes que verifiquem: criação de usuário com sucesso, criação com e-mail duplicado lançando exceção, busca por ID com sucesso, e busca por ID inexistente lançando exceção
4. WHEN os testes forem executados, THE Manager_API SHALL atingir cobertura mínima de 80% nos arquivos de service

---

### Requisito 13: Qualidade de Código — Teste E2E Funcional

**User Story:** Como desenvolvedor, quero que o teste e2e existente seja atualizado para testar os endpoints reais da API, para que o fluxo completo de autenticação seja verificado.

#### Critérios de Aceitação

1. THE Manager_API SHALL ter testes e2e que verifiquem o fluxo completo: sign-up, sign-in e acesso ao profile com token válido
2. WHEN o teste e2e for executado, THE Manager_API SHALL utilizar um banco de dados de teste isolado (SQLite in-memory ou PostgreSQL de teste)
3. THE Manager_API SHALL ter testes e2e que verifiquem respostas de erro: sign-in com credenciais inválidas, acesso ao profile sem token, e sign-up com e-mail duplicado

---

### Requisito 14: Escalabilidade — Paginação nas Consultas de Listagem

**User Story:** Como desenvolvedor, quero que futuras rotas de listagem de usuários suportem paginação, para que a API funcione bem com grandes volumes de dados.

#### Critérios de Aceitação

1. THE UserService SHALL implementar um método `findAll` que aceite parâmetros de paginação (`page` e `limit`) com valores padrão
2. WHEN uma consulta paginada for executada, THE UserService SHALL retornar os dados junto com metadados de paginação (total, página atual, total de páginas)
3. THE Manager_API SHALL validar que `page` seja maior que 0 e `limit` esteja entre 1 e 100

---

### Requisito 15: Performance — Indexação de Banco de Dados

**User Story:** Como desenvolvedor, quero que o schema Prisma tenha índices adequados, para que as consultas frequentes tenham performance otimizada.

#### Critérios de Aceitação

1. THE Manager_API SHALL adicionar um índice composto no campo `email` e `deleteAt` do modelo User no schema Prisma
2. THE Manager_API SHALL adicionar um índice no campo `createAt` do modelo User para ordenação eficiente
3. WHEN uma migration for gerada, THE Manager_API SHALL incluir os novos índices sem perda de dados existentes

---

### Requisito 16: Performance — Cache de Configuração

**User Story:** Como desenvolvedor, quero que o ConfigModule utilize cache, para que variáveis de ambiente não sejam relidas a cada injeção.

#### Critérios de Aceitação

1. THE Manager_API SHALL configurar `cache: true` no `ConfigModule.forRoot()` no AppModule
2. WHEN o ConfigService for injetado, THE Manager_API SHALL retornar valores cacheados em vez de reler variáveis de ambiente

---

### Requisito 17: Design Patterns — Repository Pattern

**User Story:** Como desenvolvedor, quero que o acesso a dados seja abstraído em repositórios, para que a lógica de negócio não dependa diretamente do Prisma.

#### Critérios de Aceitação

1. THE UserModule SHALL ter uma classe `UserRepository` que encapsule todas as operações de banco de dados do modelo User
2. THE UserService SHALL depender de uma interface `IUserRepository` em vez de acessar o PrismaService diretamente
3. WHEN os testes unitários forem escritos, THE UserService SHALL ser testável com um mock de IUserRepository sem dependência do Prisma

---

### Requisito 18: Design Patterns — Refresh Token

**User Story:** Como desenvolvedor, quero que a autenticação suporte refresh tokens, para que os usuários não precisem fazer login novamente quando o access token expirar.

#### Critérios de Aceitação

1. WHEN um usuário fizer login ou registro, THE AuthService SHALL retornar um access token de curta duração e um refresh token de longa duração
2. WHEN um refresh token válido for enviado ao endpoint de refresh, THE AuthService SHALL emitir um novo access token
3. IF um refresh token expirado ou inválido for enviado, THEN THE AuthService SHALL retornar status HTTP 401 com mensagem descritiva em pt-BR
4. THE Manager_API SHALL armazenar refresh tokens de forma segura (hash) no banco de dados associados ao usuário

---

### Requisito 19: Produção — Versionamento de API

**User Story:** Como desenvolvedor, quero que a API tenha versionamento, para que mudanças breaking possam ser introduzidas sem afetar clientes existentes.

#### Critérios de Aceitação

1. THE Manager_API SHALL configurar versionamento de API via URI prefix (ex: `/v1/`)
2. WHEN uma nova versão for criada, THE Manager_API SHALL manter a versão anterior funcional por um período de depreciação
3. THE Manager_API SHALL documentar a versão de cada endpoint no Swagger

---

### Requisito 20: Produção — Variáveis de Ambiente Seguras

**User Story:** Como desenvolvedor, quero que segredos como JWT_SECRET não tenham valores padrão no código, para que a aplicação falhe explicitamente se não forem configurados.

#### Critérios de Aceitação

1. THE Manager_API SHALL remover valores padrão (fallback) para variáveis sensíveis (`SECRET`, `DATABASE_URL`, `SALT`) na função `loadConfig`
2. WHEN uma variável de ambiente obrigatória estiver ausente, THE Manager_API SHALL falhar na inicialização com mensagem de erro clara indicando a variável faltante
3. THE Manager_API SHALL utilizar `configService.getOrThrow()` para todas as variáveis obrigatórias em vez de `configService.get()` com fallback

---

### Requisito 21: Produção — Desabilitar Swagger em Produção

**User Story:** Como desenvolvedor, quero que o Swagger seja desabilitado em ambiente de produção, para que a documentação da API não fique exposta publicamente.

#### Critérios de Aceitação

1. WHILE em ambiente de produção, THE Manager_API SHALL não registrar as rotas do Swagger
2. WHEN a variável `NODE_ENV` for `production`, THE Manager_API SHALL pular a configuração do SwaggerModule no bootstrap
3. WHILE em ambiente de desenvolvimento ou staging, THE Manager_API SHALL disponibilizar o Swagger normalmente em `/docs`

---

### Requisito 22: Experiência do Desenvolvedor — Path Aliases no TypeScript

**User Story:** Como desenvolvedor, quero utilizar path aliases no TypeScript, para que os imports sejam mais limpos e não dependam de caminhos relativos profundos.

#### Critérios de Aceitação

1. THE Manager_API SHALL configurar path aliases no tsconfig.json (ex: `@modules/*`, `@config/*`, `@generated/*`)
2. WHEN um import for escrito, THE Manager_API SHALL permitir uso de aliases em vez de caminhos relativos como `../../../generated/prisma`
3. THE Manager_API SHALL configurar o NestJS CLI e Jest para resolver os path aliases corretamente

---

### Requisito 23: Experiência do Desenvolvedor — Docker Compose para Desenvolvimento

**User Story:** Como desenvolvedor, quero um docker-compose.yml para subir o PostgreSQL localmente, para que o setup do ambiente de desenvolvimento seja simples e reproduzível.

#### Critérios de Aceitação

1. THE Manager_API SHALL incluir um arquivo `docker-compose.yml` com serviço PostgreSQL configurado
2. WHEN o comando `docker compose up` for executado, THE Manager_API SHALL disponibilizar um banco PostgreSQL acessível na porta configurada
3. THE Manager_API SHALL incluir um volume persistente para os dados do PostgreSQL no docker-compose

---

### Requisito 24: Experiência do Desenvolvedor — CI Pipeline Básico

**User Story:** Como desenvolvedor, quero um pipeline de CI configurado, para que lint, build e testes sejam executados automaticamente a cada push.

#### Critérios de Aceitação

1. THE Manager_API SHALL incluir um arquivo de configuração de CI (GitHub Actions) que execute `yarn lint`, `yarn build` e `yarn test` em cada push e pull request
2. WHEN qualquer etapa do pipeline falhar, THE CI_Pipeline SHALL reportar o erro e bloquear o merge
3. THE CI_Pipeline SHALL utilizar cache de dependências do Yarn para acelerar execuções subsequentes

---


## Priorização de Melhorias

### Quick Wins (Implementação Imediata, Alto Impacto)

| Prioridade | Requisito | Dimensão | Justificativa |
|------------|-----------|----------|---------------|
| 1 | Req 10 — Remoção de Dependências Não Utilizadas | Qualidade | TypeORM, SQLite3, serverless-http não são usados; reduz confusão e tamanho do bundle |
| 2 | Req 16 — Cache de ConfigModule | Performance | Uma linha de configuração (`cache: true`) com impacto imediato |
| 3 | Req 8 — Graceful Shutdown do Prisma | Arquitetura | Poucas linhas; evita connection leaks em produção |
| 4 | Req 20 — Variáveis de Ambiente Seguras | Produção | Remover fallbacks de segredos no `loadConfig`; previne deploy com config insegura |
| 5 | Req 2 — Helmet | Segurança | `app.use(helmet())` — uma linha para headers de segurança |
| 6 | Req 21 — Desabilitar Swagger em Produção | Produção | Condicional simples no bootstrap; evita exposição da documentação |
| 7 | Req 9 — Health Check com DB | Arquitetura | Adicionar Prisma health indicator ao check existente |

### Melhorias de Médio Prazo (1-2 Sprints)

| Prioridade | Requisito | Dimensão | Justificativa |
|------------|-----------|----------|---------------|
| 8 | Req 1 — CORS | Segurança | Configuração essencial para qualquer API em produção |
| 9 | Req 3 — Rate Limiting | Segurança | Proteção contra brute force nas rotas de auth |
| 10 | Req 6 — Global Exception Filter | Arquitetura | Padroniza respostas de erro; melhora DX do consumidor da API |
| 11 | Req 7 — Logging Estruturado | Arquitetura | Essencial para debugging em produção |
| 12 | Req 4 — Validação de Senha Forte | Segurança | Melhora segurança das contas de usuário |
| 13 | Req 11 — Soft Delete Consistente | Qualidade | O campo `deleteAt` existe mas não é usado nas queries |
| 14 | Req 12 — Testes Unitários | Qualidade | Cobertura de testes é zero atualmente |
| 15 | Req 15 — Índices de Banco | Performance | Índice composto para queries com soft delete |
| 16 | Req 22 — Path Aliases | DX | Elimina imports relativos profundos (`../../../`) |

### Melhorias Estruturais de Longo Prazo (2+ Sprints)

| Prioridade | Requisito | Dimensão | Justificativa |
|------------|-----------|----------|---------------|
| 17 | Req 5 — Strict TypeScript | Qualidade | Requer refatoração de todo o código para tipagem explícita |
| 18 | Req 17 — Repository Pattern | Design Patterns | Abstração de acesso a dados; facilita testes e troca de ORM |
| 19 | Req 13 — Testes E2E Funcionais | Qualidade | Requer setup de banco de teste isolado |
| 20 | Req 18 — Refresh Token | Design Patterns | Feature nova com modelo de dados, endpoints e lógica complexa |
| 21 | Req 19 — Versionamento de API | Produção | Mudança arquitetural que afeta todas as rotas |
| 22 | Req 14 — Paginação | Escalabilidade | Preparação para crescimento; requer novo endpoint e DTOs |
| 23 | Req 23 — Docker Compose | DX | Padroniza ambiente de desenvolvimento |
| 24 | Req 24 — CI Pipeline | DX | Automação de qualidade; depende dos testes estarem prontos |
