import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ParkingLot } from '../../parking-lots/entities/parking-lot.entity.js';
import { SpaceStatus, SpaceType } from '../enums/space.enums.js';

@Entity('parking_spaces')
@Unique('UQ_space_code_per_lot', ['lotId', 'code'])
export class ParkingSpace {
  @PrimaryGeneratedColumn()
  id: number;

  /** Label painted on the ground, e.g. "A-01". Unique inside one lot. */
  @Column({ length: 10 })
  code: string;

  @Column({ type: 'enum', enum: SpaceType, default: SpaceType.Regular })
  type: SpaceType;

  @Column({ type: 'enum', enum: SpaceStatus, default: SpaceStatus.Available })
  status: SpaceStatus;

  /** Foreign key -> parking_lots.id */
  @Column({ name: 'lot_id' })
  lotId: number;

  /** Many spaces belong to one lot. Deleting a lot deletes its spaces. */
  @ManyToOne(() => ParkingLot, (lot) => lot.spaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lot_id' })
  lot: Relation<ParkingLot>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
