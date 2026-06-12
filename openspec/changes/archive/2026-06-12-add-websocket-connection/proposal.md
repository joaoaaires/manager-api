## Why

A API hoje só expõe endpoints HTTP, sem nenhum canal de comunicação em tempo real. Para suportar funcionalidades futuras (notificações, presença, atualizações ao vivo), é necessário um endpoint WebSocket autenticado que rastreie quem está conectado, registrando entrada e saída de cada usuário.

## What Changes

- Adicionar suporte a WebSocket via Socket.IO (`@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`).
- Criar um gateway WebSocket privado: apenas conexões que apresentem um JWT válido (mesmo token Bearer usado nas rotas HTTP, com claims `sub` e `tenant`) são aceitas; conexões sem token ou com token inválido são rejeitadas/desconectadas.
- Registrar em log o momento em que o usuário conecta (login) e o momento em que desconecta (logout/saída).
- Manter a lista de usuários conectados em memória, em um array (solução provisória — sem persistência, válida apenas para instância única).
- Respeitar a configuração de CORS existente (`corsOrigin`) também no handshake do Socket.IO.

## Capabilities

### New Capabilities

- `websocket-connection`: conexão WebSocket autenticada via Socket.IO — validação de JWT no handshake, rejeição de conexões não autorizadas, log de conexão/desconexão e rastreamento em memória dos usuários conectados.

### Modified Capabilities

<!-- Nenhuma: a validação de JWT existente (jwt-tenant-claim) é reutilizada como está; nenhum requisito de capability existente muda. -->

## Impact

- **Código**: novo módulo `src/modules/websocket/` (gateway, serviço de presença em memória, testes); registro do módulo em `src/app.module.ts`.
- **Dependências**: novas dependências `@nestjs/websockets`, `@nestjs/platform-socket.io` e `socket.io`.
- **Configuração**: reutiliza `secret`, `jwtIssuer`, `jwtAudience` e `corsOrigin` já validados pelo config — nenhuma variável nova.
- **Sistemas**: o armazenamento em array limita a operação a uma única instância do servidor; escalar horizontalmente exigirá adapter externo (ex.: Redis) no futuro. O deploy serverless (`serverless-http`) não suporta conexões WebSocket persistentes — este recurso pressupõe execução como servidor de longa duração.
