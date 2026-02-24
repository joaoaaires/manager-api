import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class SqliteConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'sqlite',
      database: process.env.DATABASE_FILE_NAME || 'data.db',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
    };
  }
}
