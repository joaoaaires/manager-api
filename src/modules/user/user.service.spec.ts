import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantProvisioningService } from '../tenant/tenant-provisioning.service';
import { UserService } from './user.service';
import { EmailAlreadyExistsException, UserNotFoundException } from './errors';

describe('UserService', () => {
  let service: UserService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $executeRawUnsafe: jest.fn(),
  };

  const configServiceMock = {
    getOrThrow: jest.fn().mockReturnValue(4),
  };

  const provisioningServiceMock = {
    provisionTenant: jest.fn(),
  };

  const createUserDto = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: TenantProvisioningService,
          useValue: provisioningServiceMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('create', () => {
    it('creates schema, provisions tenant and persists user with hashed password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.$executeRawUnsafe.mockResolvedValue(0);
      provisioningServiceMock.provisionTenant.mockResolvedValue(undefined);
      prismaMock.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'user-id', ...data }),
      );

      const result = await service.create(createUserDto);

      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringMatching(/^CREATE SCHEMA "tenant_[0-9a-f]{8}"$/),
      );
      expect(provisioningServiceMock.provisionTenant).toHaveBeenCalledWith(
        result.tenant_name,
      );
      expect(result.email).toBe(createUserDto.email);
      expect(result.password).not.toBe(createUserDto.password);
      await expect(
        bcrypt.compare(createUserDto.password, result.password),
      ).resolves.toBe(true);
    });

    it('throws EmailAlreadyExistsException without creating a schema when email is taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
        EmailAlreadyExistsException,
      );
      expect(prismaMock.$executeRawUnsafe).not.toHaveBeenCalled();
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('drops the schema when tenant provisioning fails', async () => {
      const provisioningError = new Error('DDL failed');
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.$executeRawUnsafe.mockResolvedValue(0);
      provisioningServiceMock.provisionTenant.mockRejectedValue(
        provisioningError,
      );

      await expect(service.create(createUserDto)).rejects.toBe(
        provisioningError,
      );
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringMatching(
          /^DROP SCHEMA IF EXISTS "tenant_[0-9a-f]{8}" CASCADE$/,
        ),
      );
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('drops the schema when user persistence fails', async () => {
      const createError = new Error('insert failed');
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.$executeRawUnsafe.mockResolvedValue(0);
      provisioningServiceMock.provisionTenant.mockResolvedValue(undefined);
      prismaMock.user.create.mockRejectedValue(createError);

      await expect(service.create(createUserDto)).rejects.toBe(createError);
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringMatching(
          /^DROP SCHEMA IF EXISTS "tenant_[0-9a-f]{8}" CASCADE$/,
        ),
      );
    });

    it('maps P2002 to EmailAlreadyExistsException after dropping the schema', async () => {
      const uniqueViolation = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002', clientVersion: 'test' },
      );
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.$executeRawUnsafe.mockResolvedValue(0);
      provisioningServiceMock.provisionTenant.mockResolvedValue(undefined);
      prismaMock.user.create.mockRejectedValue(uniqueViolation);

      await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
        EmailAlreadyExistsException,
      );
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringMatching(
          /^DROP SCHEMA IF EXISTS "tenant_[0-9a-f]{8}" CASCADE$/,
        ),
      );
    });
  });

  describe('readOneByEmail', () => {
    it('excludes soft-deleted users from the lookup', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.readOneByEmail('john@example.com'),
      ).rejects.toBeInstanceOf(UserNotFoundException);
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'john@example.com', deleteAt: null },
      });
    });

    it('returns an active user', async () => {
      const user = { id: 'user-id', email: 'john@example.com' };
      prismaMock.user.findFirst.mockResolvedValue(user);

      await expect(service.readOneByEmail('john@example.com')).resolves.toBe(
        user,
      );
    });
  });

  describe('readOneById', () => {
    it('excludes soft-deleted users from the lookup', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.readOneById('user-id')).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-id', deleteAt: null },
      });
    });
  });
});
