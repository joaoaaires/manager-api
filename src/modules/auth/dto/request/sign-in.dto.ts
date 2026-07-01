import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'User e-mail used for login.',
  })
  @IsEmail(undefined, { message: 'O e-mail informado é inválido' })
  email!: string;

  @ApiProperty({
    example: 'secret123',
    description: 'User plain-text password.',
  })
  @IsNotEmpty({ message: 'A senha precisa ser informada.' })
  password!: string;
}
