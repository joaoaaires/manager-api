import 'dotenv/config';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

const databaseFileName = process.env.DATABASE_FILE_NAME || 'data.db';

export default new DataSource({
  type: 'sqlite',
  database: databaseFileName,
  entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations/*.{js,ts}')],
});
