import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { USER_SERVICE } from '../../user/services/user.service.interface';
import type { IUserService } from '../../user/services/user.service.interface';
import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { SignInDto } from '../dto/request/sign-in.dto';
import { SignUpDto } from '../dto/request/sign-up.dto';
import { UserUnauthorizedException } from '../errors';
import { IAuthService } from './auth.service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
  ) {}

  async register(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const user = await this.userService.createUser(signUpDto);

    const payload = { sub: user.id, tenant: user.tenantName };
    const accessToken = await this.jwtService.signAsync(payload);

    return AuthResponseDto.fromEntity(user, accessToken);
  }

  async access(signInDto: SignInDto): Promise<AuthResponseDto> {
    const user = await this.userService.getUserByEmail(signInDto.email);

    const validation = await bcrypt.compare(signInDto.password, user.password);
    if (!validation) {
      throw new UserUnauthorizedException();
    }

    const payload = { sub: user.id, tenant: user.tenantName };
    const accessToken = await this.jwtService.signAsync(payload);

    return AuthResponseDto.fromEntity(user, accessToken);
  }
}
