import {
  Controller,
  Get,
  Inject,
  Req,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { plainToInstance } from 'class-transformer';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces';
import { UserResponseDto } from './dto/response/user-response.dto';
import { User } from './entities/user.entity';
import { USER_SERVICE } from './services/user.service.interface';
import type { IUserService } from './services/user.service.interface';

@Controller()
@SerializeOptions({ excludeExtraneousValues: true })
export class UserController {
  constructor(
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
  ) {}

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
    const user = await this.userService.getUserById(request.user.id);
    return this.toResponse(user);
  }

  private toResponse(user: User): UserResponseDto {
    return plainToInstance(
      UserResponseDto,
      { ...user },
      { excludeExtraneousValues: true },
    );
  }
}
