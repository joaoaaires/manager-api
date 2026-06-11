import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from './interfaces';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { TENANT_NAME_PATTERN } from '../tenant/tenant-name.constants';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('secret'),
      issuer: configService.getOrThrow<string>('jwtIssuer'),
      audience: configService.getOrThrow<string>('jwtAudience'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    // Defense in depth: the claim is interpolated into raw SQL downstream,
    // so reject anything that is not a valid tenant schema name.
    if (!payload.tenant || !TENANT_NAME_PATTERN.test(payload.tenant)) {
      throw new UnauthorizedException();
    }

    return { id: payload.sub, tenantName: payload.tenant };
  }
}
