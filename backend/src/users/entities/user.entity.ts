import { Ride } from '../../rides/entities/ride.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;


  @Column({ nullable: true })
  role: 'passenger' | 'driver' = 'passenger';


}
