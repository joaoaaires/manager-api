import { Injectable } from '@nestjs/common';

import { PasswordHasher } from '@common/crypto/password-hasher.service';
import { EmailAlreadyExistsException, UserNotFoundException } from './errors';
import { CreateUserDto } from './dto';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Prisma } from '@generated/prisma/browser';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: createUserDto.email,
        deleteAt: null,
      },
    });

    if (user) {
      throw new EmailAlreadyExistsException();
    }

    const passwordCrypt = await this.passwordHasher.hash(
      createUserDto.password,
    );

    const data: Prisma.UserCreateInput = {
      name: createUserDto.name,
      email: createUserDto.email,
      password: passwordCrypt,
    };

    return this.prisma.user.create({
      data,
    });
  }

  async readOneByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        deleteAt: null,
      },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async readOneById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deleteAt: null,
      },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async softDelete(id: string) {
    await this.readOneById(id);
    return this.prisma.user.update({
      where: { id },
      data: { deleteAt: new Date() },
    });
  }
}
