## Why

O módulo `user` foi refatorado com sucesso para seguir SOLID (repositório com interface, service com interface, entidades de domínio, DTOs separados em `request/`/`response/`, erros customizados). Os demais módulos (`auth`, `tenant`, `websocket`) ainda seguem o padrão antigo (arquivos planos, sem interfaces, sem separação de camadas), criando inconsistência arquitetural no projeto.

## What Changes

- **Módulo `auth`**: Mover `auth.service.ts` para `services/` com interface `IAuthService`; mover `auth.controller.ts` para `controllers/`; organizar DTOs em `dto/request/` e `dto/response/`; extrair erros para `errors/`
- **Módulo `tenant`**: Mover `tenant-provisioning.service.ts` para `services/` com interface `ITenantProvisioningService`; organizar em sub-pastas
- **Módulo `websocket`**: Mover `connected-users.service.ts` para `services/` com interface `IConnectedUsersService`; consolidar gateway e interfaces
- **Base de dados**: A pasta `src/database/` já foi criada com `database.module.ts` e `prisma.service.ts` — nenhuma mudança necessária aqui
- **`app.module.ts`**: Ajustar imports para refletir os novos caminhos dos módulos refatorados

## Capabilities

### New Capabilities

- `auth-module-solid`: Refatoração do módulo auth para seguir a mesma estrutura SOLID do módulo user (services/, controllers/, dto/request, dto/response, errors/, interfaces/)
- `tenant-module-solid`: Refatoração do módulo tenant para seguir a mesma estrutura SOLID (services/ com interface, sub-pastas organizadas)
- `websocket-module-solid`: Refatoração do módulo websocket para seguir a mesma estrutura SOLID (services/ com interface consolidado)

### Modified Capabilities

- `user-controller`: Nenhuma mudança de requisito; apenas verificação de alinhamento pós-refatoração do módulo user

## Impact

- Módulos afetados: `auth`, `tenant`, `websocket`
- Arquivos movidos/renomeados: `auth.service.ts`, `auth.controller.ts`, `auth.strategy.ts`, `auth.guard.ts`, `tenant-provisioning.service.ts`, `connected-users.service.ts`
- Novos arquivos: interfaces para cada service (`IAuthService`, `ITenantProvisioningService`, `IConnectedUsersService`), tokens de injeção simbólicos
- `app.module.ts` e arquivos de spec precisarão atualizar imports
- Sem quebra de contrato de API — apenas reorganização interna
