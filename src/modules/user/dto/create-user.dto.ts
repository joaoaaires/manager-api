import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name', type: String })
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  name: string;

  @ApiProperty({ description: 'User email address', type: String })
  @IsEmail(undefined, { message: 'O e-mail informado é inválido.' })
  email: string;

  @ApiProperty({ description: 'User password (min 6 characters)', type: String })
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' })
  password: string;
}
