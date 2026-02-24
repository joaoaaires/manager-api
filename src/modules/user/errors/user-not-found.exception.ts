import { InternalServerErrorException } from '@nestjs/common';

export class UserNotFoundException extends InternalServerErrorException {
  constructor() {
    super('Usuário não encontrado!');
  }
}
