import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { UserUnauthorizedException } from './errors';

describe('AuthService', () => {
  let service: AuthService;

  const userServiceMock = {
    create: jest.fn(),
    readOneByEmail: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };

  const buildUser = async (password: string) => ({
    id: 'user-id',
    name: 'John Doe',
    email: 'john@example.com',
    password: await bcrypt.hash(password, 4),
    tenant_name: 'tenant_a1b2c3d4',
    createdAt: new Date('2026-02-19T12:00:00.000Z'),
    updatedAt: new Date('2026-02-19T12:00:00.000Z'),
    deleteAt: null,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('creates the user and returns an auth response with token', async () => {
      const user = await buildUser('secret123');
      userServiceMock.create.mockResolvedValue(user);

      const result = await service.register({
        name: user.name,
        email: user.email,
        password: 'secret123',
      });

      expect(userServiceMock.create).toHaveBeenCalledWith({
        name: user.name,
        email: user.email,
        password: 'secret123',
      });
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        tenant: user.tenant_name,
      });
      expect(result.token).toBe('jwt-token');
      expect(result.email).toBe(user.email);
    });
  });

  describe('access', () => {
    it('returns an auth response with token when password is valid', async () => {
      const user = await buildUser('secret123');
      userServiceMock.readOneByEmail.mockResolvedValue(user);

      const result = await service.access({
        email: user.email,
        password: 'secret123',
      });

      expect(userServiceMock.readOneByEmail).toHaveBeenCalledWith(user.email);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        tenant: user.tenant_name,
      });
      expect(result.token).toBe('jwt-token');
    });

    it('throws UserUnauthorizedException when password is invalid', async () => {
      const user = await buildUser('secret123');
      userServiceMock.readOneByEmail.mockResolvedValue(user);

      await expect(
        service.access({ email: user.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UserUnauthorizedException);
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });
  });
});
