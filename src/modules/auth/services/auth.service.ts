import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { USER_SERVICE } from '../../user/services/user.service.interface.js';
import type { IUserService } from '../../user/services/user.service.interface.js';
import { AuthResponseDto } from '../dto/response/auth-response.dto.js';
import { SignInDto } from '../dto/request/sign-in.dto.js';
import { SignUpDto } from '../dto/request/sign-up.dto.js';
import { UserUnauthorizedException } from '../errors/index.js';
import { IAuthService } from './auth.service.interface.js';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USER_SERVICE)
    private readonly userService: IUserService,
  ) {}

  async register(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const salt = this.configService.getOrThrow<number>('salt');
    const password = await bcrypt.hash(signUpDto.password, salt);
    const user = await this.userService.createUser({ ...signUpDto, password });

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    return AuthResponseDto.fromEntity(user, accessToken);
  }

  async access(signInDto: SignInDto): Promise<AuthResponseDto> {
    const user = await this.userService.getUserByEmail(signInDto.email);

    const validation = await bcrypt.compare(signInDto.password, user.password);
    if (!validation) {
      throw new UserUnauthorizedException();
    }

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    return AuthResponseDto.fromEntity(user, accessToken);
  }
}
