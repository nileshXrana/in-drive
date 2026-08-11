import { Ride } from '../../rides/entities/ride.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'passenger' })
  role: 'passenger' | 'driver';

  @OneToMany(() => Ride, (ride) => ride.rider)
  ridesAsRider: Ride[];

  @OneToMany(() => Ride, (ride) => ride.driver)
  ridesAsDriver: Ride[];
}
