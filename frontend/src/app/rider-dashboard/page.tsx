'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Card, Typography } from '@mui/material';
import Logout from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { logoutThunk } from '@/features/users/user.action';
import BasicSelect from '@/components/role-select';
import { io, Socket } from 'socket.io-client';
import styles from './rider-dashboard.module.css';

type RideRequestObj = {
  uuid: string;
  rider: {
    uuid: string;
    email: string;
  };
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
  notes: string;
  status: string;
  passengerCountered?: boolean;
};

type RidePayload = {
  uuid: string;
  rider: {
    uuid: string;
    email: string;
  };
  driver?: {
    uuid: string;
    email: string;
  } | null;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
  status: string;
};

export default function DriverDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.users);

  const [requests, setRequests] = useState<RideRequestObj[]>([]);
  const [activeRide, setActiveRide] = useState<RidePayload | null>(null);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.uuid) {
      return;
    }

    const socketConn = io('http://localhost:8000');
    socketRef.current = socketConn;
    socketConn.emit('join', { uuid: user.uuid, role: 'driver' });

    socketConn.on('ride_request_created', (request: RideRequestObj) => {
      setRequests((current) => {
        const filtered = current.filter((item) => item.uuid !== request.uuid);
        return [request, ...filtered];
      });
    });

    socketConn.on('ride_request_accepted', ({ requestUuid }: { requestUuid: string }) => {
      setRequests((current) => current.filter((item) => item.uuid !== requestUuid));
    });

    socketConn.on('ride_booked', (ride: RidePayload) => {
      setActiveRide(ride);
      setRideStatus(ride.status);
      setRequests((current) => current.filter((item) => item.rider.uuid !== ride.rider.uuid));
    });

    socketConn.on('ride_status_update', (data: { rideUuid: string; status: string }) => {
      setRideStatus(data.status);
      setActiveRide((current) => (current && current.uuid === data.rideUuid ? { ...current, status: data.status } : current));
    });

    return () => {
      socketRef.current = null;
      socketConn.disconnect();
    };
  }, [user?.uuid]);


  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push('/login');
  };

  const handleAcceptRequest = (req: RideRequestObj) => {
    socketRef.current?.emit('driver_accept_counter', {
      requestUuid: req.uuid,
      riderUuid: req.rider.uuid,
      driverUuid: user.uuid,
      price: req.fare,
    });
  };



  return (
    <Box className={styles.dashboard}>
      <Box className={styles.header}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
          InDrive
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <BasicSelect />
          <Button variant="outlined" color="error" sx={{ color: 'white', borderColor: 'white' }} onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 'auto', marginRight: 1, color: 'inherit' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </Button>
        </Box>
      </Box>

      <Box className={styles.mainLayout}>
        <Box className={styles.leftPanel}>
          <Box className={styles.statusCard}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Incoming Requests
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {requests.length > 0 ? `${requests.length} ride request(s) waiting` : 'No active requests right now.'}
            </Typography>
          </Box>

          {requests.map((req) => (
            <Card key={req.uuid} className={styles.requestCard} sx={{backgroundColor: '#f7f4f4da'}}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'rgba(20, 19, 19, 0.7)' }}>
                  Rider: {req.rider.email}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, margin: '8px 0' }}>
                  ₹{req.fare}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(24, 23, 23, 0.7)' }}>
                  {req.pickupLocation} to {req.dropoffLocation}
                </Typography>
                {req.notes && (
                  <Typography variant="caption" sx={{ color: 'rgba(29, 27, 27, 0.55)', display: 'block', marginTop: 1 }}>
                    Notes: {req.notes}
                  </Typography>
                )}
              </Box>
              <Box className={styles.actions}>
                <Button size="small" variant="contained" className={styles.acceptBtn} onClick={() => handleAcceptRequest(req)}>
                  Accept
                </Button>
                <Button size="small" variant="outlined" color="inherit" onClick={() => setRequests((current) => current.filter((item) => item.uuid !== req.uuid))}>
                  Ignore
                </Button>
              </Box>
            </Card>
          ))}

          {requests.length === 0 && (
            <Box className={styles.statusCard}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              waiting...
              </Typography>
            </Box>
          )}
        </Box>

        <Box className={styles.rightPanel}>
          <Box className={styles.mapContainer}>
            <Box className={styles.statusCard} sx={{ position: 'relative', zIndex: 2, margin: 3, maxWidth: 420 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Active Ride
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {activeRide ? `${activeRide.pickupLocation} to ${activeRide.dropoffLocation}` : 'No ride accepted yet.'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Status: {rideStatus || activeRide?.status || 'waiting'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

    </Box>


  );
}