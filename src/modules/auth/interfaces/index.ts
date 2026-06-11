import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  tenant: string;
  iss?: string;
  aud?: string | string[];
}

export interface AuthenticatedUser {
  id: string;
  tenantName: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
