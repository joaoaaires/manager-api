import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { TenantService } from '../../config/tenant/tenant.service';
import { UserEntity } from './entities/user.entity';
import { EmailAlreadyExistsException, UserNotFoundException } from './errors';
import { CreateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly tenantService: TenantService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    let user = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (user) {
      throw new EmailAlreadyExistsException();
    }

    const salt = this.configService.getOrThrow<number>('salt');
    const passwordCrypt = await bcrypt.hash(createUserDto.password, salt);

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

  async readOneById(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new UserNotFoundException();
    }
    return user;
  }
}
