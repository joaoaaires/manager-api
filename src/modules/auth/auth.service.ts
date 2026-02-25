import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import {
  SignUpDto,
  SignInDto,
  SignUpResponseDto,
  SignInResponseDto,
  ProfileResponseDto,
} from './dto';
import { UserUnauthorizedException } from './errors';
import { AuthGuardRequest } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  public async register(signUpDto: SignUpDto): Promise<SignUpResponseDto> {
    const user = await this.userService.create(signUpDto);

    const payload = { sub: user.id, username: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return Object.assign(new SignUpResponseDto(), {
      id: user.id,
      name: user.name,
      email: user.email,
      createAt: user.createAt,
      updateAt: user.updateAt,
      token: accessToken,
    });
  }

  public async access(signInDto: SignInDto): Promise<SignInResponseDto> {
    const user = await this.userService.readOneByEmail(signInDto.email);
    const validation = await bcrypt.compare(signInDto.password, user.password);
    if (!validation) {
      throw new UserUnauthorizedException();
    }

    const payload = { sub: user.id, username: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return Object.assign(new SignInResponseDto(), {
      id: user.id,
      name: user.name,
      email: user.email,
      createAt: user.createAt,
      updateAt: user.updateAt,
      token: accessToken,
    });
  }

  public async profile(request: AuthGuardRequest): Promise<ProfileResponseDto> {
    const payload = request.payload;
    const user = await this.userService.readOneByEmail(payload.username);

    return Object.assign(new ProfileResponseDto(), {
      id: user.id,
      name: user.name,
      email: user.email,
      createAt: user.createAt,
      updateAt: user.updateAt,
    });
  }
}
