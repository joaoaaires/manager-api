import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SignUpDto } from './modules/auth/dto/sign-up.dto';
import { SignInDto } from './modules/auth/dto/sign-in.dto';
import {
  SignUpResponseDto,
  SignInResponseDto,
  ProfileResponseDto,
} from './modules/auth/dto';
import { AuthService } from './modules/auth/auth.service';
import { AuthGuard } from './modules/auth/auth.guard';
import type { AuthGuardRequest } from './modules/auth/interfaces';

@Controller()
export class AppController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 201, description: 'User created successfully', type: SignUpResponseDto })
  @ApiConflictResponse({ description: 'Email already exists' })
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.register(signUpDto);
  }

  @Post('sign-in')
  @ApiBody({ type: SignInDto })
  @ApiResponse({ status: 201, description: 'User authenticated successfully', type: SignInResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.access(signInDto);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: ProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Bearer token' })
  profile(@Req() request: AuthGuardRequest) {
    return this.authService.profile(request);
  }

  @Get('health')
  @ApiResponse({ status: 200, description: 'API is operational' })
  health() {
    return { status: 'ok' };
  }
}
