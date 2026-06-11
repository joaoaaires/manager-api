import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

import { AuthStrategy } from './auth.strategy';
import { JwtPayload } from './interfaces';

describe('AuthStrategy', () => {
  let strategy: AuthStrategy;

  const configServiceMock = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        secret: 'test-secret',
        jwtIssuer: 'manager-api',
        jwtAudience: 'manager-api-clients',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthStrategy,
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    strategy = module.get<AuthStrategy>(AuthStrategy);
  });

  describe('validate', () => {
    it('propagates id and tenantName for a valid payload', () => {
      const payload: JwtPayload = {
        sub: 'user-id',
        tenant: 'tenant_a1b2c3d4',
      };

      expect(strategy.validate(payload)).toEqual({
        id: 'user-id',
        tenantName: 'tenant_a1b2c3d4',
      });
    });

    it('rejects a payload without tenant claim', () => {
      const payload = { sub: 'user-id' } as JwtPayload;

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });

    it('rejects a malformed tenant claim', () => {
      const payload: JwtPayload = {
        sub: 'user-id',
        tenant: 'Tenant-X"; DROP SCHEMA public CASCADE; --',
      };

      expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
    });
  });
});
