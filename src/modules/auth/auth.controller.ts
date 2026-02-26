import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { AuthResponseDto, SignInDto, SignUpDto } from './dto';
import { UserResponseDto } from '../user/dto';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './interfaces';
import { UserService } from '../user/user.service';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'User created and JWT token returned.',
  })
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
    const user = await this.userService.readOneById(request.user.id);
    return UserResponseDto.fromEntity(user);
  }
}
