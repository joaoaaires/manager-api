const loadConfig = () => {
  const salt = Number(process.env.SALT);
  if (!Number.isInteger(salt) || salt <= 0) {
    throw new Error('SALT must be a valid positive integer');
  }

  const secret = process.env.SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('SECRET must be defined and non-empty');
  }

  return {
    port: Number(process.env.PORT) || 3000,
    databaseFileName: process.env.DATABASE_FILE_NAME || 'data.db',
    salt,
    secret,
  };
};

export { loadConfig };
