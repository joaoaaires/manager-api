import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_FILE_NAME || 'data.db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
});
