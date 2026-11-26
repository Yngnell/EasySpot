import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { decimalTransformer } from '../../common/transformers/decimal.transformer.js';

@Entity('parking_lots')
export class ParkingLot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 255 })
  address: string;

  /** Coordinates used by the client's map (mapping API) */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    transformer: decimalTransformer,
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    transformer: decimalTransformer,
  })
  longitude: number;

  @Column({ name: 'opening_time', type: 'time' })
  openingTime: string;

  @Column({ name: 'closing_time', type: 'time' })
  closingTime: string;

  @Column({
    name: 'hourly_rate',
    type: 'decimal',
    precision: 8,
    scale: 2,
    transformer: decimalTransformer,
  })
  hourlyRate: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
