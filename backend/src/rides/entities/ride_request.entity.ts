import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('ride_request')
export class RideRequest {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => User, { eager: true })
  rider: User;

  @Column()
  pickupLocation: string;

  @Column()
  dropoffLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  fare: number;

  @Column({ length: 50, nullable: true })
  notes: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
