import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

/** Campos compartilhados entre cadastro via API de auth e criação de usuário no domínio user. */
export class UserRegistrationDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user.',
  })
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  name!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Unique user e-mail.',
  })
  @IsEmail(undefined, { message: 'O e-mail informado é inválido.' })
  email!: string;

  @ApiProperty({
    example: 'Secret1234',
    minLength: 8,
    description:
      'User plain-text password (min 8 chars, must include uppercase, lowercase and digit).',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.',
  })
  password!: string;
}
