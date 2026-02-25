import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @ApiProperty({ description: 'User email address', type: String })
  @IsEmail(undefined, { message: 'O e-mail informado é inválido' })
  email: string;

  @ApiProperty({ description: 'User password', type: String })
  @IsNotEmpty({ message: 'A senha precisa ser informada.' })
  password: string;
}
