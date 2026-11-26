import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer.js';
import { ParkingSpace } from '../../parking-spaces/entities/parking-space.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ReservationStatus } from '../enums/reservation-status.enum.js';

@Entity('reservations')
@Index(['spaceId', 'status'])
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  /** Foreign key -> users.id (the driver who booked) */
  @Column({ name: 'user_id' })
  userId: number;

  /** Many reservations belong to one user. A user with reservations cannot be deleted. */
  @ManyToOne(() => User, (user) => user.reservations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  /** Foreign key -> parking_spaces.id */
  @Column({ name: 'space_id' })
  spaceId: number;

  /** Many reservations belong to one space. Keeps history: a booked space cannot be deleted. */
  @ManyToOne(() => ParkingSpace, (space) => space.reservations, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'space_id' })
  space: Relation<ParkingSpace>;

  @Column({ name: 'plate_number', length: 15 })
  plateNumber: string;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.Active,
  })
  status: ReservationStatus;

  @Column({ name: 'checked_in_at', type: 'datetime', nullable: true })
  checkedInAt: Date | null;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  /** Computed when the reservation is completed: hours parked x lot hourly rate */
  @Column({
    name: 'total_fee',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  totalFee: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
