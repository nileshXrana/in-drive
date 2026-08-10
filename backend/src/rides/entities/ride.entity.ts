import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => User, (user) => user.ridesAsRider, { eager: true })
  rider: User;

  @ManyToOne(() => User, (user) => user.ridesAsDriver, { eager: true, nullable: true })
  driver: User | null;

  @Column()
  pickupLocation: string;

  @Column()
  dropoffLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fare: number;

  @Column({ default: 'requested' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
