import { loadConfig } from './load.config';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('valid configuration', () => {
    it('should return correct config object with valid env vars', () => {
      process.env.SALT = '10';
      process.env.SECRET = 'my-secret';
      process.env.PORT = '4000';
      process.env.DATABASE_FILE_NAME = 'test.db';

      const config = loadConfig();

      expect(config).toEqual({
        port: 4000,
        databaseFileName: 'test.db',
        salt: 10,
        secret: 'my-secret',
      });
    });

    it('should use default port 3000 when PORT is not set', () => {
      process.env.SALT = '10';
      process.env.SECRET = 'my-secret';
      delete process.env.PORT;

      const config = loadConfig();

      expect(config.port).toBe(3000);
    });

    it('should use default database file when DATABASE_FILE_NAME is not set', () => {
      process.env.SALT = '10';
      process.env.SECRET = 'my-secret';
      delete process.env.DATABASE_FILE_NAME;

      const config = loadConfig();

      expect(config.databaseFileName).toBe('data.db');
    });
  });

  describe('SALT validation', () => {
    beforeEach(() => {
      process.env.SECRET = 'my-secret';
    });

    it('should throw when SALT is not set', () => {
      delete process.env.SALT;

      expect(() => loadConfig()).toThrow('SALT must be a valid positive integer');
    });

    it('should throw when SALT is zero', () => {
      process.env.SALT = '0';

      expect(() => loadConfig()).toThrow('SALT must be a valid positive integer');
    });

    it('should throw when SALT is negative', () => {
      process.env.SALT = '-5';

      expect(() => loadConfig()).toThrow('SALT must be a valid positive integer');
    });

    it('should throw when SALT is a float', () => {
      process.env.SALT = '3.14';

      expect(() => loadConfig()).toThrow('SALT must be a valid positive integer');
    });

    it('should throw when SALT is non-numeric', () => {
      process.env.SALT = 'abc';

      expect(() => loadConfig()).toThrow('SALT must be a valid positive integer');
    });
  });

  describe('SECRET validation', () => {
    beforeEach(() => {
      process.env.SALT = '10';
    });

    it('should throw when SECRET is not set', () => {
      delete process.env.SECRET;

      expect(() => loadConfig()).toThrow('SECRET must be defined and non-empty');
    });

    it('should throw when SECRET is empty string', () => {
      process.env.SECRET = '';

      expect(() => loadConfig()).toThrow('SECRET must be defined and non-empty');
    });

    it('should throw when SECRET is whitespace only', () => {
      process.env.SECRET = '   ';

      expect(() => loadConfig()).toThrow('SECRET must be defined and non-empty');
    });
  });
});
