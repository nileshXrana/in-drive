import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride } from './entities/ride.entity';
import { RideRequest } from './entities/ride_request.entity';
import { User } from '../users/entities/user.entity';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class RidesGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>,
    @InjectRepository(RideRequest)
    private readonly rideRequestRepository: Repository<RideRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() data: { uuid: string; role: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user_${data.uuid}`);
    if (data.role === 'driver') {
      client.join('drivers');
    }
  }

  @SubscribeMessage('request_ride')
  async handleRequestRide(
    @MessageBody()
    data: {
      riderUuid: string;
      pickupLocation: string;
      dropoffLocation: string;
      fare: number;
      notes: string;
    },
    @ConnectedSocket() client: Socket,
    callback?: (response: RideRequest | null) => void,
  ) {
    const rider = await this.userRepository.findOne({ where: { uuid: data.riderUuid } });
    if (!rider) {
      callback?.(null);
      return;
    }

    const request = this.rideRequestRepository.create({
      rider,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      fare: data.fare,
      notes: data.notes,
      status: 'pending',
    });

    const savedRequest = await this.rideRequestRepository.save(request);

    this.server.to('drivers').emit('ride_request_created', {
      uuid: savedRequest.uuid,
      rider: {
        uuid: rider.uuid,
        email: rider.email,
      },
      pickupLocation: savedRequest.pickupLocation,
      dropoffLocation: savedRequest.dropoffLocation,
      fare: savedRequest.fare,
      notes: savedRequest.notes,
      status: savedRequest.status,
    });

    callback?.(savedRequest);
    return savedRequest;
  }

  @SubscribeMessage('driver_counter_offer')
  async handleDriverCounterOffer(
    @MessageBody()
    data: {
      requestUuid: string;
      driverUuid: string;
      driverEmail: string;
      price: number;
    },
  ) {
    const request = await this.rideRequestRepository.findOne({
      where: { uuid: data.requestUuid },
      relations: { rider: true },
    });

    if (!request) return;

    this.server.to(`user_${request.rider.uuid}`).emit('passenger_received_counter', {
      requestUuid: data.requestUuid,
      driver: {
        uuid: data.driverUuid,
        email: data.driverEmail,
      },
      price: data.price,
    });
  }

  @SubscribeMessage('passenger_counter_back')
  async handlePassengerCounterBack(
    @MessageBody()
    data: {
      requestUuid: string;
      driverUuid: string;
      price: number;
    },
  ) {
    this.server.to(`user_${data.driverUuid}`).emit('driver_received_counter', {
      requestUuid: data.requestUuid,
      price: data.price,
    });
  }

  @SubscribeMessage('passenger_accept_offer')
  async handlePassengerAcceptOffer(
    @MessageBody()
    data: {
      requestUuid: string;
      driverUuid: string;
      price: number;
    },
  ) {
    const request = await this.rideRequestRepository.findOne({
      where: { uuid: data.requestUuid },
      relations: { rider: true },
    });

    const driver = await this.userRepository.findOne({ where: { uuid: data.driverUuid } });

    if (!request || !driver) return;

    request.status = 'accepted';
    await this.rideRequestRepository.save(request);

    const ride = this.rideRepository.create({
      rider: request.rider,
      driver: driver,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      fare: data.price,
      status: 'accepted',
    });

    const savedRide = await this.rideRepository.save(ride);

    const payload = {
      uuid: savedRide.uuid,
      rider: {
        uuid: request.rider.uuid,
        email: request.rider.email,
      },
      driver: {
        uuid: driver.uuid,
        email: driver.email,
      },
      pickupLocation: savedRide.pickupLocation,
      dropoffLocation: savedRide.dropoffLocation,
      fare: savedRide.fare,
      status: savedRide.status,
    };

    this.server.to(`user_${request.rider.uuid}`).emit('ride_booked', payload);
    this.server.to(`user_${driver.uuid}`).emit('ride_booked', payload);
    this.server.to('drivers').emit('ride_request_accepted', { requestUuid: data.requestUuid });

    this.runFakeRideFlow(savedRide.uuid, request.rider.uuid, driver.uuid);
  }

  @SubscribeMessage('driver_accept_counter')
  async handleDriverAcceptCounter(
    @MessageBody()
    data: {
      requestUuid: string;
      riderUuid: string;
      driverUuid: string;
      price: number;
    },
  ) {
    const request = await this.rideRequestRepository.findOne({
      where: { uuid: data.requestUuid },
      relations: { rider: true },
    });

    const driver = await this.userRepository.findOne({ where: { uuid: data.driverUuid } });

    if (!request || !driver) return;

    request.status = 'accepted';
    await this.rideRequestRepository.save(request);

    const ride = this.rideRepository.create({
      rider: request.rider,
      driver: driver,
      pickupLocation: request.pickupLocation,
      dropoffLocation: request.dropoffLocation,
      fare: data.price,
      status: 'accepted',
    });

    const savedRide = await this.rideRepository.save(ride);

    const payload = {
      uuid: savedRide.uuid,
      rider: {
        uuid: request.rider.uuid,
        email: request.rider.email,
      },
      driver: {
        uuid: driver.uuid,
        email: driver.email,
      },
      pickupLocation: savedRide.pickupLocation,
      dropoffLocation: savedRide.dropoffLocation,
      fare: savedRide.fare,
      status: savedRide.status,
    };

    this.server.to(`user_${request.rider.uuid}`).emit('ride_booked', payload);
    this.server.to(`user_${driver.uuid}`).emit('ride_booked', payload);
    this.server.to('drivers').emit('ride_request_accepted', { requestUuid: data.requestUuid });

    this.runFakeRideFlow(savedRide.uuid, request.rider.uuid, driver.uuid);
  }

  @SubscribeMessage('rate_ride')
  async handleRateRide(
    @MessageBody() data: { rideUuid: string; rating: number },
  ) {
    const ride = await this.rideRepository.findOne({ where: { uuid: data.rideUuid } });
    if (!ride) return;

    ride.status = 'rated';
    await this.rideRepository.save(ride);

    this.server.to(`user_${ride.rider.uuid}`).emit('ride_status_update', {
      rideUuid: data.rideUuid,
      status: 'rated',
      rating: data.rating,
    });
  }

  private runFakeRideFlow(rideUuid: string, riderUuid: string, driverUuid: string) {
    setTimeout(async () => {
      this.server.to(`user_${riderUuid}`).emit('ride_status_update', {
        rideUuid,
        status: 'arriving',
      });
      this.server.to(`user_${driverUuid}`).emit('ride_status_update', {
        rideUuid,
        status: 'arriving',
      });
    }, 4000);

    setTimeout(async () => {
      const ride = await this.rideRepository.findOne({ where: { uuid: rideUuid } });
      if (ride) {
        ride.status = 'started';
        await this.rideRepository.save(ride);
      }
      this.server.to(`user_${riderUuid}`).emit('ride_status_update', {
        rideUuid,
        status: 'started',
      });
      this.server.to(`user_${driverUuid}`).emit('ride_status_update', {
        rideUuid,
        status: 'started',
      });
    }, 9000);

    setTimeout(async () => {
      const ride = await this.rideRepository.findOne({ where: { uuid: rideUuid } });
      if (ride) {
        ride.status = 'ended';
        await this.rideRepository.save(ride);
      }
      this.server.to(`user_${riderUuid}`).emit('ride_status_update', {
        rideUuid,
        status: 'ended',
      });
      this.server.to(`user_${driverUuid}`).emit('ride_status_update', {
        rideUuid,
        status: 'ended',
      });
    }, 14000);
  }
}
