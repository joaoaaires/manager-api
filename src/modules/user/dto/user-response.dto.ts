import { Expose, plainToInstance } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

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

  static fromEntity(user: UserEntity): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
