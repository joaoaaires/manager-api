import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserService } from '../user/user.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UserUnauthorizedException } from './errors';
import { AuthResponseDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  public async register(signUpDto: SignUpDto) {
    const user = await this.userService.create(signUpDto);

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    return AuthResponseDto.fromEntity(user, accessToken);
  }

  public async access(signInDto: SignInDto) {
    const user = await this.userService.readOneByEmail(signInDto.email);

    const validation = await bcrypt.compare(signInDto.password, user.password);
    if (!validation) {
      throw new UserUnauthorizedException();
    }

    const payload = { sub: user.id };
    const accessToken = await this.jwtService.signAsync(payload);

    return AuthResponseDto.fromEntity(user, accessToken);
  }
}
