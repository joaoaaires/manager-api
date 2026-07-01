## Context

O módulo `user` foi refatorado seguindo os princípios SOLID:
- Interface de repositório com token simbólico (`USER_REPOSITORY`, `IUserRepository`)
- Interface de serviço com token simbólico (`USER_SERVICE`, `IUserService`)
- Entidade de domínio em `entities/`
- DTOs separados em `dto/request/` e `dto/response/`
- Erros de domínio customizados em `errors/`
- `PrismaService` movido de `src/modules/prisma/` para `src/database/`

Os módulos `auth`, `tenant` e `websocket` ainda seguem o padrão antigo: arquivos planos, sem interfaces, sem separação de camadas, e alguns ainda referenciam o caminho antigo do Prisma (`../prisma/prisma.service`).

## Goals / Non-Goals

**Goals:**
- Aplicar a mesma estrutura de pastas e padrão de interface/token ao módulo `auth`
- Aplicar a mesma estrutura ao módulo `tenant`
- Aplicar a mesma estrutura ao módulo `websocket`
- Corrigir imports desatualizados (referências ao antigo `../prisma/prisma.service`)
- Fazer `auth.service.ts` usar `IUserService` (via `@Inject(USER_SERVICE)`) em vez da classe concreta `UserService`
- Corrigir chamadas de método obsoletas em `auth.service.ts` (`userService.create` → `createUser`, `userService.readOneByEmail` → `getUserByEmail`)

**Non-Goals:**
- Alterar lógica de negócio ou contrato de API
- Adicionar novos endpoints ou funcionalidades
- Refatorar o módulo `health` (simples demais para justificar camadas adicionais)
- Criar repositórios para `auth` ou `websocket` (não há persistência própria nestes módulos)

## Decisions

### 1. Padrão de interface com token simbólico

**Decisão**: Cada serviço recebe uma interface (`IXxxService`) e um token simbólico (`XXX_SERVICE = Symbol(...)`) no mesmo arquivo de interface (`xxx.service.interface.ts`), dentro de `services/`.

**Rationale**: Segue exatamente o padrão estabelecido no módulo `user`. Consistência reduz curva de aprendizado e facilita refatoração futura.

**Alternativas descartadas**: Usar strings como tokens de injeção — propenso a colisão e sem type-safety.

### 2. Auth service injetando IUserService, não UserService

**Decisão**: `AuthService` injeta `IUserService` via `@Inject(USER_SERVICE)` em vez de depender da classe concreta.

**Rationale**: Dependency Inversion Principle (o "D" do SOLID). `AuthModule` já importa `UserModule` que exporta `USER_SERVICE` — não é necessária nenhuma mudança de módulo.

**Alternativas descartadas**: Manter dependência na classe concreta — viola DIP e impossibilita testes com mocks sem sobrescrever o módulo inteiro.

### 3. Tenant module: manter serviço único sem repositório

**Decisão**: `TenantProvisioningService` move para `services/` com interface, mas sem criar repositório separado.

**Rationale**: O serviço executa DDL diretamente via Prisma (`$executeRawUnsafe`). Introduzir um repositório para isso seria over-engineering sem benefício real.

### 4. Websocket module: mover ConnectedUsersService para services/

**Decisão**: `ConnectedUsersService` move para `services/` com interface `IConnectedUsersService`. Gateway permanece na raiz do módulo.

**Rationale**: O gateway é o ponto de entrada WebSocket (análogo a um controller). Services contêm a lógica de estado — separar mantém a coesão do padrão.

### 5. DTOs auth: consolidar em request/ e response/

**Decisão**: Mover `sign-up.dto.ts` e `sign-in.dto.ts` para `dto/request/`; mover `auth-response.dto.ts` para `dto/response/`. Remover arquivos DTOs da raiz de `dto/` e atualizar o barrel `index.ts`.

**Rationale**: As pastas `request/` e `response/` já existem (criadas mas vazias). Completar a organização que já foi iniciada.

## Risks / Trade-offs

- **Risco: quebra de imports em specs ou arquivos não mapeados** → Mitigação: busca por `auth.service`, `UserService` direto e `../prisma/` antes de considerar completo.
- **Risco: métodos `userService.create` e `userService.readOneByEmail` já removidos** → `IUserService` atual tem `createUser` e `getUserByEmail` — corrigir as chamadas em `auth.service.ts` faz parte desta mudança.
- **Trade-off: mais arquivos por módulo** → Contrabalançado por melhor testabilidade, substitutibilidade e consistência com o padrão já estabelecido no módulo `user`.
