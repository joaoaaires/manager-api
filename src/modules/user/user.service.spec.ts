import { Test, TestingModule } from '@nestjs/testing';

import { PasswordHasher } from '@common/crypto/password-hasher.service';
import { UserService } from './user.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { EmailAlreadyExistsException } from './errors/email-already-exists.exception';
import { UserNotFoundException } from './errors/user-not-found.exception';

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
  let passwordHasher: { hash: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    passwordHasher = { hash: jest.fn().mockResolvedValue('hashed-password') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordHasher, useValue: passwordHasher },
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
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: createUserDto.email, deleteAt: null },
      });
      expect(passwordHasher.hash).toHaveBeenCalledWith(createUserDto.password);
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
      const now = new Date();
      const deletedUser = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        password: mockUser.password,
        createAt: mockUser.createAt,
        updateAt: mockUser.updateAt,
        deleteAt: now,
      };
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(deletedUser);

      await service.softDelete('user-id-1');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-id-1', deleteAt: null },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: { deleteAt: expect.any(Date) },
      });
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
