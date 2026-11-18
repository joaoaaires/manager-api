import { AuthResponseDto } from '../dto/response/auth-response.dto.js';
import { SignInDto } from '../dto/request/sign-in.dto.js';
import { SignUpDto } from '../dto/request/sign-up.dto.js';

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface IAuthService {
  register(dto: SignUpDto): Promise<AuthResponseDto>;
  access(dto: SignInDto): Promise<AuthResponseDto>;
}
