# Plano de Implementação

- [ ] 1. Escrever teste exploratório da condição de bug
  - **Property 1: Fault Condition** - Tipos incorretos, status HTTP errados e typo na mensagem
  - **CRITICAL**: Este teste DEVE FALHAR no código sem correção — a falha confirma que os bugs existem
  - **NÃO tente corrigir o teste ou o código quando ele falhar**
  - **NOTA**: Este teste codifica o comportamento esperado — ele validará a correção quando passar após a implementação
  - **GOAL**: Expor contraexemplos que demonstram a existência dos bugs
  - **Abordagem PBT com escopo definido**: Para bugs determinísticos, escopar a propriedade aos casos concretos de falha
  - Testar que `UserEntity.id` está tipado como `number` quando `@PrimaryGeneratedColumn('uuid')` gera `string` (da Condição de Falha no design — `isBugCondition` com `category == "type_mismatch"` e `field == "UserEntity.id"`)
  - Testar que `JwtPayload.sub` está tipado como `number` quando deveria ser `string` (da Condição de Falha no design — `isBugCondition` com `category == "type_mismatch"` e `field == "JwtPayload.sub"`)
  - Testar que `new EmailAlreadyExistsException()` retorna status HTTP 500 ao invés de 409 (da Condição de Falha no design — `isBugCondition` com `category == "wrong_http_status"` e `exception == "EmailAlreadyExistsException"`)
  - Testar que `new UserNotFoundException()` retorna status HTTP 500 ao invés de 404 (da Condição de Falha no design — `isBugCondition` com `category == "wrong_http_status"` e `exception == "UserNotFoundException"`)
  - Testar que `new UserUnauthorizedException().message` contém "sena" e não contém "senha" (da Condição de Falha no design — `isBugCondition` com `category == "typo_message"`)
  - Executar teste no código SEM correção — esperar FALHA (isso confirma que os bugs existem)
  - Documentar contraexemplos encontrados (ex: `UserEntity.id` declarado como `number` mas recebe UUID string; `EmailAlreadyExistsException` retorna 500 ao invés de 409)
  - Marcar tarefa como completa quando o teste estiver escrito, executado e a falha documentada
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Escrever testes de propriedade de preservação (ANTES de implementar a correção)
  - **Property 2: Preservation** - Comportamento inalterado para criação de usuário, autenticação JWT e busca de perfil
  - **IMPORTANTE**: Seguir metodologia de observação primeiro
  - Observar: `EmailAlreadyExistsException` mantém a mensagem "E-mail já existe." no código sem correção
  - Observar: `UserNotFoundException` mantém a mensagem "Usuário não encontrado!" no código sem correção
  - Observar: `UserUnauthorizedException` estende `UnauthorizedException` (status 401) no código sem correção
  - Observar: `UserEntity` mantém os campos `name`, `email`, `password`, `createAt`, `updateAt`, `deleteAt` com tipos `string` no código sem correção
  - Observar: `JwtPayload` mantém a propriedade `username` como `string` no código sem correção
  - Observar: `AuthGuardRequest` mantém a propriedade `payload` do tipo `JwtPayload` no código sem correção
  - Escrever teste de propriedade: para todas as exceções customizadas, as mensagens de erro devem permanecer inalteradas (dos Requisitos de Preservação no design — requisitos 3.1 a 3.5)
  - Escrever teste de propriedade: para `UserEntity`, todos os campos exceto `id` devem manter seus tipos originais
  - Escrever teste de propriedade: para `JwtPayload`, a propriedade `username` deve permanecer como `string`
  - Verificar que os testes PASSAM no código SEM correção
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [-] 3. Correção dos bugs críticos

  - [x] 3.1 Corrigir tipo de `UserEntity.id` de `number` para `string`
    - Alterar `id: number` para `id: string` em `src/modules/user/entities/user.entity.ts`
    - _Bug_Condition: isBugCondition(input) onde input.category == "type_mismatch" AND input.context.field == "UserEntity.id"_
    - _Expected_Behavior: O campo `id` deve ser tipado como `string` para corresponder ao UUID gerado pelo TypeORM_
    - _Preservation: Todos os outros campos da entidade devem manter seus tipos originais (3.1)_
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Corrigir tipo de `JwtPayload.sub` de `number` para `string`
    - Alterar `sub: number` para `sub: string` em `src/modules/auth/interfaces/index.ts`
    - _Bug_Condition: isBugCondition(input) onde input.category == "type_mismatch" AND input.context.field == "JwtPayload.sub"_
    - _Expected_Behavior: A propriedade `sub` deve ser tipada como `string` para corresponder ao UUID do ID do usuário_
    - _Preservation: A propriedade `username` e a interface `AuthGuardRequest` devem permanecer inalteradas (3.2)_
    - _Requirements: 1.2, 2.2, 3.2_

  - [x] 3.3 Corrigir `EmailAlreadyExistsException` para estender `ConflictException` (409)
    - Alterar import de `InternalServerErrorException` para `ConflictException` em `src/modules/user/errors/email-already-exists.exception.ts`
    - Alterar `extends InternalServerErrorException` para `extends ConflictException`
    - _Bug_Condition: isBugCondition(input) onde input.category == "wrong_http_status" AND input.context.exception == "EmailAlreadyExistsException" AND input.context.statusCode == 500_
    - _Expected_Behavior: A exceção deve retornar status HTTP 409 (Conflict)_
    - _Preservation: A mensagem de erro "E-mail já existe." deve permanecer inalterada (3.4)_
    - _Requirements: 1.3, 2.3, 3.4_

  - [x] 3.4 Corrigir `UserNotFoundException` para estender `NotFoundException` (404)
    - Alterar import de `InternalServerErrorException` para `NotFoundException` em `src/modules/user/errors/user-not-found.exception.ts`
    - Alterar `extends InternalServerErrorException` para `extends NotFoundException`
    - _Bug_Condition: isBugCondition(input) onde input.category == "wrong_http_status" AND input.context.exception == "UserNotFoundException" AND input.context.statusCode == 500_
    - _Expected_Behavior: A exceção deve retornar status HTTP 404 (Not Found)_
    - _Preservation: A mensagem de erro "Usuário não encontrado!" deve permanecer inalterada (3.5)_
    - _Requirements: 1.4, 2.4, 3.5_

  - [x] 3.5 Corrigir typo "sena" para "senha" em `UserUnauthorizedException`
    - Alterar `'E-mail e/ou sena inválidos!'` para `'E-mail e/ou senha inválidos!'` em `src/modules/auth/errors/user-unauthorized.exception.ts`
    - _Bug_Condition: isBugCondition(input) onde input.category == "typo_message" AND input.context.message CONTAINS "sena" AND NOT CONTAINS "senha"_
    - _Expected_Behavior: A mensagem deve conter "senha" com grafia correta_
    - _Preservation: A exceção deve continuar estendendo `UnauthorizedException` com status 401 (3.2)_
    - _Requirements: 1.5, 2.5, 3.2_

  - [ ] 3.6 Verificar que o teste exploratório da condição de bug agora passa
    - **Property 1: Expected Behavior** - Tipos corretos, status HTTP semânticos e mensagem corrigida
    - **IMPORTANTE**: Re-executar o MESMO teste da tarefa 1 — NÃO escrever um novo teste
    - O teste da tarefa 1 codifica o comportamento esperado
    - Quando este teste passar, confirma que o comportamento esperado está satisfeito
    - Executar teste exploratório da condição de bug da etapa 1
    - **RESULTADO ESPERADO**: Teste PASSA (confirma que os bugs foram corrigidos)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.7 Verificar que os testes de preservação ainda passam
    - **Property 2: Preservation** - Comportamento inalterado para criação de usuário, autenticação JWT e busca de perfil
    - **IMPORTANTE**: Re-executar os MESMOS testes da tarefa 2 — NÃO escrever novos testes
    - Executar testes de propriedade de preservação da etapa 2
    - **RESULTADO ESPERADO**: Testes PASSAM (confirma que não há regressões)
    - Confirmar que todos os testes ainda passam após a correção (sem regressões)

- [ ] 4. Checkpoint - Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se surgirem dúvidas.
