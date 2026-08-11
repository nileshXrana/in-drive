'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Card, TextField, Typography } from '@mui/material';
import Logout from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { logoutThunk } from '@/features/users/user.action';
import BasicSelect from '@/components/role-select';
import { getRides } from '@/services/ride.service';
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

type RideHistoryItem = RidePayload & {
  rider?: {
    uuid: string;
    email: string;
  };
  driver?: {
    uuid: string;
    email: string;
  } | null;
};

export default function DriverDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.users);

  const [requests, setRequests] = useState<RideRequestObj[]>([]);
  const [activeRide, setActiveRide] = useState<RidePayload | null>(null);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [counterInputs, setCounterInputs] = useState<{ [requestUuid: string]: string }>({});
  const [currentPrices, setCurrentPrices] = useState<{ [requestUuid: string]: number }>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.uuid) {
      return;
    }

    const fetchRides = async () => {
      try {
        const data = await getRides();
        setRides(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching rides:', error);
      }
    };

    fetchRides();

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
      setCounterInputs((current) => {
        const next = { ...current };
        delete next[requestUuid];
        return next;
      });
      setCurrentPrices((current) => {
        const next = { ...current };
        delete next[requestUuid];
        return next;
      });
    });

    socketConn.on('driver_received_counter', ({ requestUuid, price }: { requestUuid: string; price: number }) => {
      setCurrentPrices((current) => ({ ...current, [requestUuid]: price }));
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
      price: currentPrices[req.uuid] ?? req.fare,
    });
  };

  const handleCounterRequest = (req: RideRequestObj) => {
    const price = counterInputs[req.uuid];
    if (!price) return;

    socketRef.current?.emit('driver_counter_offer', {
      requestUuid: req.uuid,
      driverUuid: user.uuid,
      driverEmail: user.email,
      price: parseFloat(price),
    });

    setCurrentPrices((current) => ({ ...current, [req.uuid]: parseFloat(price) }));
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
            <Card key={req.uuid} className={styles.requestCard} sx={{ backgroundColor: '#f7f4f4da' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'rgba(20, 19, 19, 0.7)' }}>
                  Rider: {req.rider.email}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, margin: '8px 0' }}>
                  ₹{currentPrices[req.uuid] ?? req.fare}
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
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                <TextField
                  size="small"
                  placeholder="Price"
                  type="number"
                  value={counterInputs[req.uuid] || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCounterInputs((current) => ({
                      ...current,
                      [req.uuid]: e.target.value,
                    }))
                  }
                  sx={{ flex: 1, color: '#0c0c0c', borderColor: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}
                />
                <Button
                  size="small"
                  variant="contained"
                  className={styles.counterBtn}
                  onClick={() => handleCounterRequest(req)}
                  disabled={!counterInputs[req.uuid]}
                >
                  Counter
                </Button>
              </Box>
            </Card>
          ))}

          {requests.length === 0 && (
            <Box className={styles.statusCard}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                waiting for rides...
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
            {/* show all rides of the driver in a list */}
            <Box className={styles.rideList}>
              <Box>
                {rides.length > 0 ? (
                  rides.map((ride) => (
                    <Box key={ride.uuid} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, paddingY: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography variant="body2" sx={{ color: 'white' }}>
                        {ride.pickupLocation} to {ride.dropoffLocation}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        Status: {ride.status} · ₹{ride.fare}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  'All Your Rides'
                )}
              </Box>
            </Box>


          </Box>

        </Box>
      </Box>

    </Box>


  );
}