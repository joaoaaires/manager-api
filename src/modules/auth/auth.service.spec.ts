import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserUnauthorizedException } from './errors';
import {
  SignUpResponseDto,
  SignInResponseDto,
  ProfileResponseDto,
} from './dto';
import { UserEntity } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync'>>;
  let userService: jest.Mocked<Pick<UserService, 'create' | 'readOneByEmail'>>;

  const mockUser: UserEntity = {
    id: 'uuid-123',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    createAt: new Date('2025-01-01'),
    updateAt: new Date('2025-01-01'),
    deleteAt: null as unknown as Date,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token-123') },
        },
        {
          provide: UserService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            readOneByEmail: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
    userService = module.get(UserService);
  });

  describe('register', () => {
    it('should return a SignUpResponseDto with correct fields', async () => {
      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeInstanceOf(SignUpResponseDto);
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createAt: mockUser.createAt,
        updateAt: mockUser.updateAt,
        token: 'jwt-token-123',
      });
    });

    it('should not include password in the response', async () => {
      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should call userService.create and jwtService.signAsync', async () => {
      const dto = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      await authService.register(dto);

      expect(userService.create).toHaveBeenCalledWith(dto);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.email,
      });
    });
  });

  describe('access', () => {
    it('should return a SignInResponseDto with correct fields', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.access({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toBeInstanceOf(SignInResponseDto);
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createAt: mockUser.createAt,
        updateAt: mockUser.updateAt,
        token: 'jwt-token-123',
      });
    });

    it('should not include password in the response', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.access({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).not.toHaveProperty('password');
    });

    it('should throw UserUnauthorizedException on wrong password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.access({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UserUnauthorizedException);
    });
  });

  describe('profile', () => {
    it('should return a ProfileResponseDto with correct fields', async () => {
      const request = {
        payload: { sub: 'uuid-123', username: 'test@example.com' },
      } as any;

      const result = await authService.profile(request);

      expect(result).toBeInstanceOf(ProfileResponseDto);
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createAt: mockUser.createAt,
        updateAt: mockUser.updateAt,
      });
    });

    it('should not include password or token in the response', async () => {
      const request = {
        payload: { sub: 'uuid-123', username: 'test@example.com' },
      } as any;

      const result = await authService.profile(request);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('token');
    });
  });
});
