import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

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
    it('returns id for a valid payload', () => {
      const payload: JwtPayload = { sub: 'user-id' };

      expect(strategy.validate(payload)).toEqual({ id: 'user-id' });
    });
  });
});
