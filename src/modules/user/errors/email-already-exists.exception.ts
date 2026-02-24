import { InternalServerErrorException } from '@nestjs/common';

export class EmailAlreadyExistsException extends InternalServerErrorException {
  constructor() {
    super('E-mail já existe.');
  }
}
