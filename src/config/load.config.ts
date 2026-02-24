import 'dotenv/config';

const envs = {
  port: process.env.PORT,
  databaseFileName: process.env.DATABASE_FILE_NAME || 'data.db',
  salt: Number(process.env.SALT),
  secret: process.env.SECRET,
};

export default envs;
export const loadConfig = () => envs;
