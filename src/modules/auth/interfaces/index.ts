export interface JwtPayload {
  sub: string;
  username: string;
}

export interface AuthGuardRequest extends Request {
  payload: JwtPayload;
}
