import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { RideRequest } from './entities/ride_request.entity';
import { User } from '../users/entities/user.entity';
import { RideService } from './rides.service';
import { RideController } from './rides.controller';
import { RidesGateway } from './rides.gateway';
import {UserService} from "../users/user.service";

@Module({
  imports: [TypeOrmModule.forFeature([Ride, RideRequest, User])],
  controllers: [RideController],
  providers: [RideService, RidesGateway, UserService],
  exports: [RideService, TypeOrmModule],
})
export class RidesModule {}