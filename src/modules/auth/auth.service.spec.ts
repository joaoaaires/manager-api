import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { USER_SERVICE } from '../user/services/user.service.interface';
import { AuthService } from './services/auth.service';
import { UserUnauthorizedException } from './errors';

describe('AuthService', () => {
  let service: AuthService;

  const userServiceMock = {
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn().mockResolvedValue('jwt-token'),
  };

  const buildUser = (password: string) => ({
    id: 'user-id',
    name: 'John Doe',
    email: 'john@example.com',
    password: password,
    tenantName: 'tenant_a1b2c3d4',
    createdAt: new Date('2026-02-19T12:00:00.000Z'),
    updatedAt: new Date('2026-02-19T12:00:00.000Z'),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtServiceMock.signAsync.mockResolvedValue('jwt-token');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_SERVICE, useValue: userServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('creates the user and returns an auth response with token', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 4);
      const user = buildUser(hashedPassword);
      userServiceMock.createUser.mockResolvedValue(user);

      const result = await service.register({
        name: user.name,
        email: user.email,
        password: 'secret123',
      });

      expect(userServiceMock.createUser).toHaveBeenCalledWith({
        name: user.name,
        email: user.email,
        password: 'secret123',
      });
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        tenant: user.tenantName,
      });
      expect(result.token).toBe('jwt-token');
      expect(result.email).toBe(user.email);
    });
  });

  describe('access', () => {
    it('returns an auth response with token when password is valid', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 4);
      const user = buildUser(hashedPassword);
      userServiceMock.getUserByEmail.mockResolvedValue(user);

      const result = await service.access({
        email: user.email,
        password: 'secret123',
      });

      expect(userServiceMock.getUserByEmail).toHaveBeenCalledWith(user.email);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: user.id,
        tenant: user.tenantName,
      });
      expect(result.token).toBe('jwt-token');
    });

    it('throws UserUnauthorizedException when password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('secret123', 4);
      const user = buildUser(hashedPassword);
      userServiceMock.getUserByEmail.mockResolvedValue(user);

      await expect(
        service.access({ email: user.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UserUnauthorizedException);
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });
  });
});
