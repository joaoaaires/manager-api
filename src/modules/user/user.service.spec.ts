import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { EmailAlreadyExistsException } from './errors/email-already-exists.exception';
import { UserNotFoundException } from './errors/user-not-found.exception';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findOneBy' | 'save'>>;
  let configService: jest.Mocked<Pick<ConfigService, 'get'>>;

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
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(10),
          },
        },
      ],
    }).compile();

    userService = module.get(UserService);
    userRepository = module.get(UserRepository);
    configService = module.get(ConfigService);
  });

  describe('create', () => {
    it('should hash the password and save the user', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      userRepository.save.mockResolvedValue(mockUser);

      const dto = { name: 'Test User', email: 'test@example.com', password: 'password123' };
      const result = await userService.create(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: '$2b$10$hashedpassword' }),
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw EmailAlreadyExistsException on duplicate email', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(
        userService.create({ name: 'Another', email: 'test@example.com', password: 'pass123' }),
      ).rejects.toThrow(EmailAlreadyExistsException);

      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should retrieve salt from ConfigService', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      userRepository.save.mockResolvedValue(mockUser);

      await userService.create({ name: 'Test', email: 'new@example.com', password: 'pass123' });

      expect(configService.get).toHaveBeenCalledWith('salt');
    });
  });

  describe('readOneByEmail', () => {
    it('should return the user when found', async () => {
      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await userService.readOneByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should throw UserNotFoundException when user is not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(
        userService.readOneByEmail('nonexistent@example.com'),
      ).rejects.toThrow(UserNotFoundException);
    });
  });
});
