import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserService } from '../user/user.service';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/sign-in.dto';
import { UserUnauthorizedException } from './errors';
import { AuthGuardRequest } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  public async register(signUpDto: SignUpDto) {
    const user = await this.userService.create(signUpDto);

    const payload = { sub: user.id, username: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...response } = user; //remover o password
    return { ...response, token: accessToken }; // adicionar o token
  }

  public async access(signInDto: SignInDto) {
    const user = await this.userService.readOneByEmail(signInDto.email);
    const validation = await bcrypt.compare(signInDto.password, user.password);
    if (!validation) {
      throw new UserUnauthorizedException();
    }

    const payload = { sub: user.id, username: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    const { password, ...response } = user; //remover o password
    return { ...response, token: accessToken }; // adicionar o token
  }

  public async profile(request: AuthGuardRequest) {
    const payload = request.payload;
    const user = await this.userService.readOneByEmail(payload.username);
    const { password, ...response } = user; //remover o password
    return response;
  }
}
