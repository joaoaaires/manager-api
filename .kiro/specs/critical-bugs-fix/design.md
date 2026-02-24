# Correção de Bugs Críticos - Design de Bugfix

## Visão Geral

Este documento formaliza a abordagem de correção para cinco bugs críticos no projeto manager-api que afetam: (1) tipagem incorreta do campo `id` da entidade `UserEntity` e da propriedade `sub` da interface `JwtPayload` — ambos tipados como `number` quando deveriam ser `string` (UUID), (2) exceções HTTP com códigos de status incorretos — `EmailAlreadyExistsException` e `UserNotFoundException` retornando 500 ao invés de 409 e 404 respectivamente, e (3) um typo na mensagem de erro de credenciais inválidas ("sena" ao invés de "senha"). A estratégia de correção é cirúrgica: alterar apenas os tipos, classes base das exceções e a string da mensagem, sem modificar nenhuma lógica de negócio.

## Glossário

- **Bug_Condition (C)**: Conjunto de condições que disparam os bugs — tipagem incorreta de UUID, exceções com status HTTP errado, e mensagem com typo
- **Property (P)**: Comportamento desejado após a correção — tipos corretos para UUID, status HTTP semânticos (409, 404), e mensagem com grafia correta
- **Preservation**: Comportamentos existentes que devem permanecer inalterados — criação de usuário, autenticação JWT, busca de perfil, hash de senha
- **UserEntity**: Entidade TypeORM em `src/modules/user/entities/user.entity.ts` que representa o usuário no banco de dados
- **JwtPayload**: Interface em `src/modules/auth/interfaces/index.ts` que define a estrutura do payload JWT
- **EmailAlreadyExistsException**: Exceção em `src/modules/user/errors/email-already-exists.exception.ts` lançada quando e-mail já está cadastrado
- **UserNotFoundException**: Exceção em `src/modules/user/errors/user-not-found.exception.ts` lançada quando usuário não é encontrado
- **UserUnauthorizedException**: Exceção em `src/modules/auth/errors/user-unauthorized.exception.ts` lançada quando credenciais são inválidas

## Detalhes dos Bugs

### Condição de Falha

Os bugs se manifestam em três categorias distintas:

**Categoria 1 — Incompatibilidade de Tipo (Bugs 1.1 e 1.2):** O TypeORM gera UUIDs como `string` via `@PrimaryGeneratedColumn('uuid')`, mas `UserEntity.id` e `JwtPayload.sub` estão tipados como `number`. Isso causa incompatibilidade silenciosa em tempo de compilação e pode gerar comportamento inesperado em comparações e validações.

**Categoria 2 — Status HTTP Incorretos (Bugs 1.3 e 1.4):** `EmailAlreadyExistsException` e `UserNotFoundException` estendem `InternalServerErrorException` (500), mascarando erros de domínio como erros internos do servidor.

**Categoria 3 — Typo na Mensagem (Bug 1.5):** A mensagem de `UserUnauthorizedException` contém "sena" ao invés de "senha".

**Especificação Formal:**
```
FUNCTION isBugCondition(input)
  INPUT: input de tipo { category: string, context: any }
  OUTPUT: boolean

  IF input.category == "type_mismatch" THEN
    RETURN (input.context.field == "UserEntity.id" AND typeof(input.context.value) == "string" AND declaredType == "number")
           OR (input.context.field == "JwtPayload.sub" AND typeof(input.context.value) == "string" AND declaredType == "number")
  END IF

  IF input.category == "wrong_http_status" THEN
    RETURN (input.context.exception == "EmailAlreadyExistsException" AND input.context.statusCode == 500)
           OR (input.context.exception == "UserNotFoundException" AND input.context.statusCode == 500)
  END IF

  IF input.category == "typo_message" THEN
    RETURN input.context.exception == "UserUnauthorizedException"
           AND input.context.message CONTAINS "sena"
           AND NOT input.context.message CONTAINS "senha"
  END IF

  RETURN false
END FUNCTION
```
