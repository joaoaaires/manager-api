import { AuthResponseDto } from '../dto/response/auth-response.dto';
import { SignInDto } from '../dto/request/sign-in.dto';
import { SignUpDto } from '../dto/request/sign-up.dto';

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface IAuthService {
  register(dto: SignUpDto): Promise<AuthResponseDto>;
  access(dto: SignInDto): Promise<AuthResponseDto>;
}
