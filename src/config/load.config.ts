export const loadConfig = () => ({
  port: Number(process.env.PORT ?? 3000),
  databaseFileName: process.env.DATABASE_FILE_NAME || 'data.db',
  salt: Number(process.env.SALT ?? 10),
  secret: process.env.SECRET,
  jwtExpiresIn: Number(process.env.JWT_EXPIRES_IN ?? 86400),
  jwtIssuer: process.env.JWT_ISSUER ?? 'manager-api',
  jwtAudience: process.env.JWT_AUDIENCE ?? 'manager-api-clients',
});
