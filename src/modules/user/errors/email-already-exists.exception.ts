import { ConflictException } from '@nestjs/common';

export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    super('E-mail já existe.');
  }
}
