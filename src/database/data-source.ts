import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';

const databaseFileName = process.env.DATABASE_FILE_NAME || 'data.db';

export default new DataSource({
  type: 'sqlite',
  database: databaseFileName,
  entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*.{js,ts}')],
});
