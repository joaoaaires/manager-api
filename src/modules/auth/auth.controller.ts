import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { AuthResponseDto, SignInDto, SignUpDto } from './dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'User created and JWT token returned.',
  })
  @ApiTooManyRequestsResponse({ description: 'Too many requests.' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.register(signUpDto);
  }

  @ApiOperation({ summary: 'Authenticate an existing user' })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'User authenticated and JWT token returned.',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid e-mail and/or password.' })
  @ApiTooManyRequestsResponse({ description: 'Too many requests.' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.access(signInDto);
  }
}
