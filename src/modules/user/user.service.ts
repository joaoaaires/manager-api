import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { EmailAlreadyExistsException, UserNotFoundException } from './errors';
import { CreateUserDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/browser';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (user) {
      throw new EmailAlreadyExistsException();
    }

    const salt = this.configService.getOrThrow<number>('salt');
    const passwordCrypt = await bcrypt.hash(createUserDto.password, salt);

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
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }

  async readOneById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }
}
