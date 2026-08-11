import { Body, Controller, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../users/entities/user.entity';
import { RideService } from './rides.service';
type ride_status = 'pending' | 'rated' | 'accepted' | 'started' | 'ended';

@Controller('rides')
export class RideController {
  constructor(private readonly rideService: RideService) { }

  @UseGuards(AuthGuard)
  @Get('user')
  async getRidesOfUser(@Request() req: any) {
    return this.rideService.getRidesOfUser(req.user.uuid);
  }


  @UseGuards(AuthGuard)
  @Post()
  async createRide(@Body() body: { rider: User; pickupLocation: string; pickupLatitude?: number; pickupLongitude?: number; dropoffLocation: string; dropoffLatitude?: number; dropoffLongitude?: number; fare?: number }) {
    return this.rideService.createRide({
      rider: body.rider,
      pickupLocation: body.pickupLocation,
      pickupLatitude: body.pickupLatitude ?? null,
      pickupLongitude: body.pickupLongitude ?? null,
      dropoffLocation: body.dropoffLocation,
      dropoffLatitude: body.dropoffLatitude ?? null,
      dropoffLongitude: body.dropoffLongitude ?? null,
      fare: body.fare ?? 0,
    });
  }

  @UseGuards(AuthGuard)
  @Put(':uuid/status')
  async updateStatus(@Param('uuid') uuid: string, @Body('status') status: ride_status) {
    return this.rideService.updateStatus(uuid, status);
  }
}
