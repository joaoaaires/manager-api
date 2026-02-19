import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @IsEmail(undefined, { message: 'O e-mail informado é inválido' })
  email: string;

  @IsNotEmpty({ message: 'A senha precisa ser informada.' })
  password: string;
}
