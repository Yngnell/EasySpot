import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { Reservation } from '../../reservations/entities/reservation.entity.js';

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

  // type must be explicit: TypeScript cannot describe "string | null" to TypeORM
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  /** One user (driver) has many reservations */
  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Relation<Reservation[]>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
