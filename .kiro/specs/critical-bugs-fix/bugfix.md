# Documento de Requisitos de Correção de Bugs

## Introdução

Este documento descreve um conjunto de bugs críticos identificados no projeto manager-api que afetam a integridade de tipos, os códigos de status HTTP das respostas de erro e uma mensagem de erro com typo. Esses bugs podem causar comportamento inesperado em runtime, respostas HTTP incorretas para o cliente e confusão na mensagem de validação de credenciais.

## Análise de Bugs

### Comportamento Atual (Defeito)

1.1 QUANDO a entidade `UserEntity` é criada com `@PrimaryGeneratedColumn('uuid')` ENTÃO o campo `id` está tipado como `number`, causando incompatibilidade de tipo com o valor UUID gerado (que é `string`)

1.2 QUANDO o JWT payload é construído com `user.id` (UUID string) ENTÃO a interface `JwtPayload.sub` está tipada como `number`, causando incompatibilidade de tipo entre o valor real (string UUID) e o tipo declarado

1.3 QUANDO um usuário tenta se cadastrar com um e-mail já existente ENTÃO o sistema lança `EmailAlreadyExistsException` que estende `InternalServerErrorException`, retornando status HTTP 500 ao invés de 409 (Conflict)

1.4 QUANDO o sistema busca um usuário que não existe ENTÃO o sistema lança `UserNotFoundException` que estende `InternalServerErrorException`, retornando status HTTP 500 ao invés de 404 (Not Found)

1.5 QUANDO o usuário fornece credenciais inválidas no sign-in ENTÃO o sistema retorna a mensagem "E-mail e/ou sena inválidos!" com typo na palavra "senha" (escrito "sena")

### Comportamento Esperado (Correto)

2.1 QUANDO a entidade `UserEntity` é criada com `@PrimaryGeneratedColumn('uuid')` ENTÃO o campo `id` DEVERÁ ser tipado como `string` para corresponder ao tipo UUID gerado pelo TypeORM

2.2 QUANDO o JWT payload é construído com `user.id` ENTÃO a interface `JwtPayload.sub` DEVERÁ ser tipada como `string` para corresponder ao tipo UUID do ID do usuário

2.3 QUANDO um usuário tenta se cadastrar com um e-mail já existente ENTÃO o sistema DEVERÁ lançar `EmailAlreadyExistsException` estendendo `ConflictException`, retornando status HTTP 409 (Conflict)

2.4 QUANDO o sistema busca um usuário que não existe ENTÃO o sistema DEVERÁ lançar `UserNotFoundException` estendendo `NotFoundException`, retornando status HTTP 404 (Not Found)

2.5 QUANDO o usuário fornece credenciais inválidas no sign-in ENTÃO o sistema DEVERÁ retornar a mensagem "E-mail e/ou senha inválidos!" com a grafia correta da palavra "senha"

### Comportamento Inalterado (Prevenção de Regressão)

3.1 QUANDO um novo usuário é criado com sucesso ENTÃO o sistema DEVERÁ CONTINUAR A gerar um UUID como ID e salvar o usuário no banco de dados corretamente

3.2 QUANDO um usuário faz sign-in com credenciais válidas ENTÃO o sistema DEVERÁ CONTINUAR A gerar um token JWT válido contendo `sub` (ID do usuário) e `username` (e-mail)

3.3 QUANDO um usuário autenticado acessa o endpoint de perfil ENTÃO o sistema DEVERÁ CONTINUAR A retornar os dados do usuário sem o campo password

3.4 QUANDO um usuário é criado com e-mail único ENTÃO o sistema DEVERÁ CONTINUAR A criar o usuário sem lançar exceção

3.5 QUANDO um usuário existente é buscado por e-mail ENTÃO o sistema DEVERÁ CONTINUAR A retornar os dados do usuário corretamente
