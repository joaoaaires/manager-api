import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import envs from '../../config/load.config';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { EmailAlreadyExistsException, UserNotFoundException } from './errors';
import { CreateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (user) {
      throw new EmailAlreadyExistsException();
    }

    const passwordCrypt = await bcrypt.hash(createUserDto.password, envs.salt);

    user = new UserEntity();
    Object.assign(user, {
      ...createUserDto,
      password: passwordCrypt,
    } as UserEntity);

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
