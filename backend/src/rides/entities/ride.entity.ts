import { User } from '../../users/entities/user.entity';
export type ride_status = 'pending' | 'rated' | 'accepted' | 'started' | 'ended';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  pickupLocation: string;

  @Column()
  dropoffLocation: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fare: number;

  @Column({ default: 'pending' })
  status: ride_status;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.ridesAsRider, { eager: true })
  rider: User;

  @ManyToOne(() => User, (user) => user.ridesAsDriver, { eager: true, nullable: true })
  driver: User | null;

}
