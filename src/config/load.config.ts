export const loadConfig = () => ({
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  salt: Number(process.env.SALT),
  secret: process.env.SECRET,
  jwtExpiresIn: Number(process.env.JWT_EXPIRES_IN),
  jwtIssuer: process.env.JWT_ISSUER,
  jwtAudience: process.env.JWT_AUDIENCE,
  corsOrigins: process.env.CORS_ORIGINS,
});
