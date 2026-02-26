import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { AuthenticatedRequest } from '../auth/interfaces';
import { AuthGuard } from '../auth/auth.guard';
import { UserService } from './user.service';
import { UserResponseDto } from './dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
