import { Inject, Injectable } from '@nestjs/common';

import { CreateUserDto } from '../dto/request/create-user.dto';
import { User } from '../entities/user.entity';
import { EmailAlreadyExistsException, UserNotFoundException } from '../errors';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../repositories/user.repository.interface';
import { IUserService } from './user.service.interface';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    let user = await this.userRepository.findByEmail(dto.email);

    if (user) {
      throw new EmailAlreadyExistsException();
    }

    user = User.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      tenantName: 'teste',
    });

    return await this.userRepository.save(user);
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }
}
