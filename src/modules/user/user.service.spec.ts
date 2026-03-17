import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailAlreadyExistsException } from './errors/email-already-exists.exception';
import { UserNotFoundException } from './errors/user-not-found.exception';

jest.mock('bcrypt');

const mockUser = {
  id: 'user-id-1',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'hashed-password',
  createAt: new Date(),
  updateAt: new Date(),
  deleteAt: null,
};

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let configService: { getOrThrow: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    configService = { getOrThrow: jest.fn().mockReturnValue(10) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Secret123',
    };

    it('should create a user successfully', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: createUserDto.email, deleteAt: null },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          password: 'hashed-password',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw EmailAlreadyExistsException when email is taken', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        EmailAlreadyExistsException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('readOneByEmail', () => {
    it('should return a user by email', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.readOneByEmail('john@example.com');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'john@example.com', deleteAt: null },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundException when user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.readOneByEmail('unknown@example.com'),
      ).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('readOneById', () => {
    it('should return a user by id', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.readOneById('user-id-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-id-1', deleteAt: null },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw UserNotFoundException when id not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.readOneById('nonexistent-id')).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete a user by setting deleteAt', async () => {
      const deletedUser = { ...mockUser, deleteAt: new Date() };
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(deletedUser);

      const result = await service.softDelete('user-id-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-id-1', deleteAt: null },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { deleteAt: expect.any(Date) },
      });
      expect(result.deleteAt).not.toBeNull();
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent-id')).rejects.toThrow(
        UserNotFoundException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
