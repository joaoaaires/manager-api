import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'sqlite',
  database: 'data.db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
});
