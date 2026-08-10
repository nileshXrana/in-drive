import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../users/entities/user.entity';
import { RideService } from './rides.service';

@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @UseGuards(AuthGuard)
  @Get()
  async getRides() {
    return this.rideService.findAll();
  }

  @UseGuards(AuthGuard)
  @Post()
  async createRide(@Body() body: { rider: User; pickupLocation: string; dropoffLocation: string; fare?: number }) {
    return this.rideService.createRide({
      rider: body.rider,
      pickupLocation: body.pickupLocation,
      dropoffLocation: body.dropoffLocation,
      fare: body.fare ?? 0,
    });
  }

  @UseGuards(AuthGuard)
  @Put(':uuid/status')
  async updateStatus(@Param('uuid') uuid: string, @Body('status') status: string) {
    return this.rideService.updateStatus(uuid, status);
  }
}
