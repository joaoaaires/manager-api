import { UnauthorizedException } from '@nestjs/common';

export class UserUnauthorizedException extends UnauthorizedException {
  constructor() {
    super('E-mail e/ou senha inválidos!');
  }
}
