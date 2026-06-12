## Context

A API é um monólito NestJS 11 (Express) com autenticação JWT via Passport (`AuthStrategy` valida `secret`, `jwtIssuer`, `jwtAudience` e exige claim `tenant` compatível com `TENANT_NAME_PATTERN`). Toda a configuração já é validada com Zod em `src/config/`. Não existe hoje nenhum transporte em tempo real. O pedido é uma "rota" WebSocket privada usando Socket.IO, com log de entrada/saída de usuários e rastreamento dos conectados em um array em memória.

## Goals / Non-Goals

**Goals:**
- Endpoint Socket.IO autenticado: apenas tokens JWT válidos (mesmos critérios da API HTTP) podem completar a conexão.
- Log estruturado (`Logger` do Nest) na conexão ("login") e na desconexão ("saída") de cada usuário, incluindo `userId` e `tenant`.
- Registro em memória (array) dos usuários conectados, com adição na conexão e remoção na desconexão.
- Handshake respeitando o `corsOrigin` já configurado.

**Non-Goals:**
- Eventos de negócio (chat, notificações etc.) — esta mudança entrega apenas o canal autenticado e a presença.
- Persistência da lista de conectados ou suporte a múltiplas instâncias (Redis adapter) — explicitamente adiado.
- Endpoint HTTP para consultar quem está online (pode ser proposta futura).

## Decisions

### 1. Gateway NestJS (`@WebSocketGateway`) com `@nestjs/platform-socket.io`
Usar o suporte nativo do Nest a Socket.IO em vez de instanciar um servidor Socket.IO manualmente em `main.ts`. Mantém o padrão de módulos do projeto (DI, testabilidade com `Test.createTestingModule`) e o ciclo de vida gerenciado pelo Nest. Alternativa rejeitada: servidor Socket.IO standalone — fugiria da arquitetura do projeto e dificultaria injeção de `JwtService`/`ConfigService`.

### 2. Autenticação no handshake via middleware do Socket.IO (`afterInit`), não por guard
Guards do Nest em gateways só executam em handlers de mensagem (`@SubscribeMessage`), **não** no evento de conexão — um guard não impede a conexão em si. A validação será feita em middleware registrado em `afterInit` (`server.use(...)`): extrai o token de `handshake.auth.token` (fallback: header `Authorization: Bearer`), verifica com `JwtService.verifyAsync` usando `secret`, `issuer` e `audience` do `ConfigService`, e aplica a mesma validação de tenant (`TENANT_NAME_PATTERN`) da `AuthStrategy`. Falha ⇒ `next(new Error('Unauthorized'))`, que rejeita o handshake antes de `handleConnection` ser chamado. O payload validado é anexado a `socket.data.user` como `AuthenticatedUser`.

Alternativa rejeitada: validar dentro de `handleConnection` com `socket.disconnect()` — funciona, mas a conexão chega a ser estabelecida e o evento de conexão dispara para um usuário não autenticado; o middleware rejeita antes.

### 3. `@nestjs/jwt` para verificação (módulo já presente nas dependências)
`@nestjs/jwt` já está em `package.json` (usado pelo `AuthModule`). Reutilizar `JwtService` evita duplicar lógica do `passport-jwt`, que é acoplado ao request HTTP do Express e não se aplica ao handshake do Socket.IO.

### 4. Presença em array dentro de um serviço dedicado (`ConnectedUsersService`)
Um provider singleton com array privado `{ socketId, userId, tenantName, connectedAt }` e métodos `add`, `remove(socketId)` e `list()`. Isolar o array em um serviço (em vez de propriedade do gateway) torna a troca futura por Redis uma mudança local e permite teste unitário sem socket real. Chave de remoção é `socketId` (não `userId`): o mesmo usuário pode ter múltiplas conexões (abas/dispositivos) e cada uma deve ser rastreada e removida individualmente.

### 5. Namespace raiz com path padrão `/socket.io`
Sem namespace customizado por enquanto — o requisito é uma única "rota" de conexão. CORS do gateway configurado com o mesmo `corsOrigin` do `ConfigService` (via `OnGatewayInit`/opções dinâmicas), mantendo a política única de origem.

## Risks / Trade-offs

- [Array em memória perde estado em restart e não funciona com múltiplas instâncias] → Aceito explicitamente pelo usuário como provisório; o isolamento em `ConnectedUsersService` minimiza o custo da migração futura para Redis adapter + store compartilhado.
- [Deploy serverless (`serverless-http` está nas dependências) não suporta WebSocket persistente] → Documentado no proposal; o recurso pressupõe execução como processo de longa duração. Validar o ambiente de deploy antes de depender do recurso em produção.
- [Token expira durante a conexão e o socket permanece autenticado] → Aceito nesta fase: a validação ocorre apenas no handshake, igual a uma sessão HTTP de longa duração. Mitigação futura: verificação periódica de expiração ou desconexão forçada via TTL.
- [`handleDisconnect` pode disparar para socket que nunca foi adicionado (rejeitado no middleware em versões/edge cases)] → `remove(socketId)` é idempotente: remover um id inexistente é no-op e não loga saída.
- [Vazamento de memória se `remove` não for chamado] → Socket.IO garante o evento `disconnect` para toda conexão estabelecida; cobertura de teste para o par add/remove.
