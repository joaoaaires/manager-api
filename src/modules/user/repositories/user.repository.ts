import { Injectable } from '@nestjs/common';

import { Prisma, User as PrismaUser } from '@prisma-client';
import { PrismaService } from '~/database/prisma.service';
import { User } from '../entities/user.entity';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async save(user: User): Promise<User> {
    const data: Prisma.UserCreateInput = {
      name: user.name,
      email: user.email,
      password: user.password,
      tenant_name: user.tenantName,
    };

    const record: PrismaUser = await this.prisma.user.create({ data });

    return this.toDomain(record);
  }
  async findById(id: string): Promise<User | null> {
    const record: PrismaUser | null = await this.prisma.user.findUnique({
      where: { id, deleteAt: null },
    });

    return record ? this.toDomain(record) : null;
  }
  async findByEmail(email: string): Promise<User | null> {
    const record: PrismaUser | null = await this.prisma.user.findUnique({
      where: { email, deleteAt: null },
    });

    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: PrismaUser) {
    return new User({
      id: record.id,
      name: record.name,
      email: record.email,
      password: record.password,
      tenantName: record.tenant_name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deleteAt ?? undefined,
    });
  }
}
