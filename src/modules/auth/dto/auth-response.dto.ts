import { Expose, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../user/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({ example: 'b3909d91-3cbd-49cf-8c87-859d417fc18b' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  @Expose()
  email!: string;

  @ApiProperty({ example: '2026-02-19T12:00:00.000Z' })
  @Expose()
  createAt!: string;

  @ApiProperty({ example: '2026-02-19T12:00:00.000Z' })
  @Expose()
  updateAt!: string;

  @ApiProperty({
    description: 'JWT access token.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.signature',
  })
  @Expose()
  token!: string;

  static fromEntity(user: UserEntity, token: string): AuthResponseDto {
    return plainToInstance(
      AuthResponseDto,
      { ...user, token },
      { excludeExtraneousValues: true },
    );
  }
}
