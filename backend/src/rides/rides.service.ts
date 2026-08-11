import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Ride, ride_status } from './entities/ride.entity';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
  ) { }

  async findAll(): Promise<Ride[]> {
    return this.rideRepository.find();
  }

  async findOne(uuid: string): Promise<Ride | null> {
    return this.rideRepository.findOne({ where: { uuid } });
  }

  async createRide(data: Partial<Ride> & { rider: User; pickupLocation: string; dropoffLocation: string }): Promise<Ride> {
    const ride = this.rideRepository.create(data);
    return this.rideRepository.save(ride);
  }

  async updateStatus(uuid: string, status: ride_status): Promise<Ride> {
    const ride = await this.rideRepository.findOne({ where: { uuid } });

    if (!ride) {
      throw new NotFoundException('Ride not found');
    }

    ride.status = status;
    return this.rideRepository.save(ride);
  }
}
