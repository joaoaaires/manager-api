import { join } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityTarget, Repository } from 'typeorm';

@Injectable()
export class TenantService {
  // private connections = new Map<string, DataSource>();

  constructor(private readonly configService: ConfigService) {}



  // async getDataSource(): Promise<DataSource> {
  //   const databaseFileName = 'joaojoaojoao';
  //   let dataSource = this.connections.get(databaseFileName);

  //   if (dataSource) {
  //     return dataSource;
  //   }

  //   dataSource = new DataSource({
  //     type: 'sqlite',
  //     database: databaseFileName,
  //     entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  //     synchronize: false,
  //   });

  //   await dataSource.initialize();

  //   this.connections.set(databaseFileName, dataSource);

  //   return dataSource;
  // }

  // async getRepository<T>(
  //   tenantId: string,
  //   entity: EntityTarget<T>,
  // ): Promise<Repository<T>> {
  //   const dataSource = await this.getDataSource(tenantId);
  //   return dataSource.getRepository(entity);
  // }
}
