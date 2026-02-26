import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from './interfaces';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('secret'),
      issuer: configService.getOrThrow<string>('jwtIssuer'),
      audience: configService.getOrThrow<string>('jwtAudience'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return { id: payload.sub };
  }
}
