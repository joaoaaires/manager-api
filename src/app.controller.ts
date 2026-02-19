import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { SignUpDto } from './modules/auth/dto/sign-up.dto';
import { SignInDto } from './modules/auth/dto/sign-in.dto';
import { AuthService } from './modules/auth/auth.service';
import { AuthGuard } from './modules/auth/auth.guard';
import type { AuthGuardRequest } from './modules/auth/interfaces';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.register(signUpDto);
  }

  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.access(signInDto);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  profile(@Req() request: AuthGuardRequest) {
    return this.authService.profile(request);
  }
}
