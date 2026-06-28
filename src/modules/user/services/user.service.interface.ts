import { CreateUserDto } from '../dto';
import { User } from '../entities/user.entity';

export const USER_SERVICE = Symbol('USER_SERVICE');

export interface IUserService {
  createUser(dto: CreateUserDto): Promise<User>;
  getUserById(id: string): Promise<User>;
  getUserByEmail(email: string): Promise<User>;
}
