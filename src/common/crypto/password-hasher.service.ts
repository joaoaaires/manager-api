import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHasher {
  constructor(private readonly configService: ConfigService) {}

  async hash(plain: string): Promise<string> {
    const salt = this.configService.getOrThrow<number>('salt');
    return bcrypt.hash(plain, salt);
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
