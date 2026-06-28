import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: '3205a837-7475-4969-8950-2d49ef6a47f5' })
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
  createdAt!: string;

  @ApiProperty({ example: '2026-02-19T12:00:00.000Z' })
  @Expose()
  updatedAt!: string;
}
