export interface JwtPayload {
  sub: string;
  iss?: string;
  aud?: string | string[];
}

export interface AuthenticatedUser {
  id: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
