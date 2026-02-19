export interface JwtPayload {
  sub: number;
  username: string;
}

export interface AuthGuardRequest extends Request {
  payload: JwtPayload;
}
