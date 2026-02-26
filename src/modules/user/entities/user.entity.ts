import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', length: 100, nullable: false })
  name!: string;

  @Column({ name: 'email', length: 70, nullable: false })
  @Index('UQ_user_email_active', {
    unique: true,
    where: '"delete_at" IS NULL',
  })
  email!: string;

  @Column({ name: 'password', length: 255, nullable: false })
  password!: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt!: string;

  @UpdateDateColumn({ name: 'update_at' })
  updateAt!: string;

  @DeleteDateColumn({ name: 'delete_at', nullable: true })
  deleteAt!: string | null;
}
