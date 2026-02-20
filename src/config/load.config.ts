const envs = {
  port: process.env.PORT,
};

export default envs;
export const loadConfig = () => envs;
