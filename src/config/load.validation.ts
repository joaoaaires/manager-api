import { z } from 'zod';

type Env = Record<string, unknown>;

const envSchema = z.object({
  PORT: z.coerce.number().positive(),
  DATABASE_URL: z.string().min(1),
  SALT: z.coerce.number().positive(),
  SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.coerce.number().positive(),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
  CORS_ORIGIN: z.string().min(1).optional(),
});

export const loadValidation = (env: Env): Env => {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Environment variable validation failed: ${errors}`);
  }

  return result.data as unknown as Env;
};
