import 'dotenv/config';

const envs = {
  port: Number(process.env.PORT),
  database: process.env.DATABASE,
  salt: Number(process.env.SALT),
  secret: process.env.SECRET,
};

export default envs;

export const loadConfig = () => envs;
