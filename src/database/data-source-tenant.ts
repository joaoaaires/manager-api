import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';

const databaseFileName = process.env.DATABASE_FILE_NAME || 'data.db';

export default new DataSource({
  type: 'sqlite',
  database: databaseFileName.replace('.db', '-tenant.db'),
  entities: [join(__dirname, '/../modules-tenant/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/migrations-tenant/*.{js,ts}')],
});
