import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SqliteConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const databaseFileName =
      this.configService.getOrThrow<string>('databaseFileName');

    return {
      type: 'sqlite',
      database: databaseFileName,
      entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
      synchronize: false,
    };
  }
}
