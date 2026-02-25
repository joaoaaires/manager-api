import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UserEntity } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { EmailAlreadyExistsException, UserNotFoundException } from './errors';
import { CreateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (user) {
      throw new EmailAlreadyExistsException();
    }

    const salt = this.configService.get<number>('salt')!;
    const passwordCrypt = await bcrypt.hash(createUserDto.password, salt);

    user = new UserEntity();
    Object.assign(user, {
      ...createUserDto,
      password: passwordCrypt,
    });

    return this.userRepository.save(user);
  }

  async readOneByEmail(email: string) {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }
}
