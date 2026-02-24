import { Controller, Post } from '@nestjs/common';

@Controller()
export class AuthController {
  constructor() {}

  @Post('/sign-up')
  signUp(): string {
    return 'signUp';
  }

  @Post('/sign-in')
  signIn(): string {
    return 'signIn';
  }
}
