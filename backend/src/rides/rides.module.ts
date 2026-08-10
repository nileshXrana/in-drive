import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ride } from './entities/ride.entity';
import { RideService } from './rides.service';
import { RideController } from './rides.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ride])],
  controllers: [RideController],
  providers: [RideService],
  exports: [RideService],
})
export class RidesModule {}
