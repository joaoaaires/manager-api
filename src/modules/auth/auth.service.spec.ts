import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { PasswordHasher } from '@common/crypto/password-hasher.service';
import { AuthService } from './auth.service';
import { UserService } from '@modules/user/user.service';
import { UserUnauthorizedException } from './errors/user-unauthorized.exception';
import { UserNotFoundException } from '@modules/user/errors/user-not-found.exception';

const mockUser = {
  id: 'user-id-1',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed-password',
  createAt: new Date('2026-01-01'),
  updateAt: new Date('2026-01-01'),
  deleteAt: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let userService: {
    create: jest.Mock;
    readOneByEmail: jest.Mock;
    readOneById: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };
  let passwordHasher: { verify: jest.Mock };

  beforeEach(async () => {
    userService = {
      create: jest.fn(),
      readOneByEmail: jest.fn(),
      readOneById: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('jwt-access-token'),
    };
    passwordHasher = { verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: PasswordHasher, useValue: passwordHasher },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const signUpDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secret123',
    };

    it('should register a user and return auth response with token', async () => {
      userService.create.mockResolvedValue(mockUser);

      const result = await service.register(signUpDto);

      expect(userService.create).toHaveBeenCalledWith(signUpDto);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
      });
      expect(result).toHaveProperty('token', 'jwt-access-token');
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('access (login)', () => {
    const signInDto = {
      email: 'john@example.com',
      password: 'Secret123',
    };

    it('should login successfully with valid credentials', async () => {
      userService.readOneByEmail.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(true);

      const result = await service.access(signInDto);

      expect(userService.readOneByEmail).toHaveBeenCalledWith(signInDto.email);
      expect(passwordHasher.verify).toHaveBeenCalledWith(
        signInDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
      });
      expect(result).toHaveProperty('token', 'jwt-access-token');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UserUnauthorizedException on invalid password', async () => {
      userService.readOneByEmail.mockResolvedValue(mockUser);
      passwordHasher.verify.mockResolvedValue(false);

      await expect(service.access(signInDto)).rejects.toThrow(
        UserUnauthorizedException,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundException when email does not exist', async () => {
      userService.readOneByEmail.mockRejectedValue(new UserNotFoundException());

      await expect(service.access(signInDto)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should throw UserNotFoundException for soft-deleted user', async () => {
      userService.readOneByEmail.mockRejectedValue(new UserNotFoundException());

      await expect(service.access(signInDto)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user by id', async () => {
      userService.readOneById.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(userService.readOneById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should propagate UserNotFoundException', async () => {
      userService.readOneById.mockRejectedValue(new UserNotFoundException());

      await expect(service.getProfile('missing-id')).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });
});
