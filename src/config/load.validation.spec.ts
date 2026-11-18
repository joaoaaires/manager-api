import { loadValidation } from './load.validation';

describe('loadValidation', () => {
  const validEnv = {
    PORT: '3000',
    DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
    SALT: '10',
    SECRET: 'mysecret',
    JWT_EXPIRES_IN: '3600',
    JWT_ISSUER: 'issuer',
    JWT_AUDIENCE: 'audience',
  };

  it('should return validated data when env is valid', () => {
    const result = loadValidation(validEnv);
    expect(result).toEqual({
      PORT: 3000,
      DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
      SALT: 10,
      SECRET: 'mysecret',
      JWT_EXPIRES_IN: 3600,
      JWT_ISSUER: 'issuer',
      JWT_AUDIENCE: 'audience',
    });
  });

  it('should throw error when a required variable is missing', () => {
    const { PORT, ...invalidEnv } = validEnv;
    expect(() => loadValidation(invalidEnv)).toThrow(
      'Environment variable validation failed: PORT: Invalid input: expected number, received NaN',
    );
  });

  it('should throw error when a variable has invalid type', () => {
    const invalidEnv = { ...validEnv, PORT: 'abc' };
    expect(() => loadValidation(invalidEnv)).toThrow(
      'Environment variable validation failed: PORT: Invalid input: expected number, received NaN',
    );
  });

  it('should throw error when a number is not positive', () => {
    const invalidEnv = { ...validEnv, SALT: '-1' };
    expect(() => loadValidation(invalidEnv)).toThrow(
      'Environment variable validation failed: SALT: Too small: expected number to be >0',
    );
  });

  it('should throw error when DATABASE_URL is not a MariaDB URL', () => {
    const invalidEnv = {
      ...validEnv,
      DATABASE_URL: 'postgres://localhost:5432/db',
    };
    expect(() => loadValidation(invalidEnv)).toThrow(
      'Environment variable validation failed: DATABASE_URL: must be a mysql:// or mariadb:// URL',
    );
  });
});
