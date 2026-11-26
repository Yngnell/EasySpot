import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ length: 100, unique: true })
  email: string;

  /** bcrypt hash only. select: false keeps it out of normal queries. */
  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.Driver })
  role: Role;

  @Column({ length: 20, nullable: true })
  phone: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
