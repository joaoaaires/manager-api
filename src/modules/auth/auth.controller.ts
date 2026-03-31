import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { AuthResponseDto, SignInDto, SignUpDto } from './dto';
import { UserResponseDto } from '@modules/user/dto';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './interfaces';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'User created and JWT token returned.',
  })
  @ApiTooManyRequestsResponse({
    description: 'Limite de requisições excedido.',
  })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
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
  @ApiTooManyRequestsResponse({
    description: 'Limite de requisições excedido.',
  })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.access(signInDto);
  }

  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiBearerAuth('bearer')
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'Authenticated user profile.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token.' })
  @UseGuards(AuthGuard)
  @Get('profile')
  async profile(@Req() request: AuthenticatedRequest) {
    const user = await this.authService.getProfile(request.user.id);
    return UserResponseDto.fromEntity(user);
  }
}
