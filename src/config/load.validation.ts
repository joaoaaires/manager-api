type Env = Record<string, unknown>;

const getString = (env: Env, key: string): string => {
  const value = env[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing or invalid environment variable: ${key}`);
  }
  return value;
};

const getPositiveNumber = (env: Env, key: string): number => {
  const value = Number(getString(env, key));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Environment variable must be a positive number: ${key}`);
  }
  return value;
};

export const loadValidation = (env: Env): Env => {
  getPositiveNumber(env, 'PORT');
  getString(env, 'DATABASE_FILE_NAME');
  getPositiveNumber(env, 'SALT');
  getString(env, 'SECRET');
  getPositiveNumber(env, 'JWT_EXPIRES_IN');
  getString(env, 'JWT_ISSUER');
  getString(env, 'JWT_AUDIENCE');
  return env;
};
