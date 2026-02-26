import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
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
    example: 'secret123',
    minLength: 6,
    description: 'User plain-text password.',
  })
  @MinLength(6, { message: 'A senha precisa ter pelo menos 6 caracteres.' })
  password!: string;
}
