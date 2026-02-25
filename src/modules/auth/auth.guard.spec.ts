import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

  const mockPayload = { sub: 'uuid-123', username: 'test@example.com' };

  function createMockContext(authHeader?: string): ExecutionContext {
    const request: Record<string, any> = {
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'authorization') return authHeader ?? null;
          return null;
        }),
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn().mockResolvedValue(mockPayload) },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    guard = module.get(AuthGuard);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should extract Bearer token and set payload on request', async () => {
    const context = createMockContext('Bearer valid-token');
    const request = context.switchToHttp().getRequest<any>();

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'test-secret',
    });
    expect(request.payload).toEqual(mockPayload);
  });

  it('should use ConfigService to get the secret', async () => {
    const context = createMockContext('Bearer valid-token');

    await guard.canActivate(context);

    expect(configService.get).toHaveBeenCalledWith('secret');
  });

  it('should throw UnauthorizedException when no token is provided', async () => {
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when Authorization header has no Bearer prefix', async () => {
    const context = createMockContext('Basic some-token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token verification fails', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));
    const context = createMockContext('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
