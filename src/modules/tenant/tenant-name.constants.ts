// Valid PostgreSQL schema name for tenants; shared by provisioning (DDL) and
// JWT claim validation so the two checks can never drift apart.
export const TENANT_NAME_PATTERN = /^[a-z_][a-z0-9_]{0,62}$/;
