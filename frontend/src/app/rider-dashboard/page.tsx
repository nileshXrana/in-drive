'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, CircularProgress, Card } from '@mui/material';
import Logout from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { logoutThunk, getUserThunk } from '@/features/users/user.action';
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

export default function DriverDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.users);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [requests, setRequests] = useState<RideRequestObj[]>([]);
  const [counterPrices, setCounterPrices] = useState<{ [requestUuid: string]: string }>({});

  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<string>('');
  const [step, setStep] = useState<'list' | 'booked'>('list');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [carProgress, setCarProgress] = useState(0);

  useEffect(() => {
    if (!user) {
      dispatch(getUserThunk()).then((res) => {
        if (!res.payload) {
          router.push('/login');
        }
      });
      return;
    }

    const socketConn = io('http://localhost:8000');
    socketConn.emit('join', { uuid: user.uuid, role: 'driver' });
    setSocket(socketConn);

    socketConn.on('ride_request_created', (reqData: RideRequestObj) => {
      setRequests((prev) => {
        if (prev.some((r) => r.uuid === reqData.uuid)) return prev;
        return [...prev, reqData];
      });
    });

    socketConn.on('ride_request_accepted', (data: { requestUuid: string }) => {
      setRequests((prev) => prev.filter((r) => r.uuid !== data.requestUuid));
    });

    socketConn.on('driver_received_counter', (data: { requestUuid: string; price: number }) => {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.uuid === data.requestUuid) {
            return { ...r, fare: data.price, passengerCountered: true };
          }
          return r;
        })
      );
    });

    socketConn.on('ride_booked', (ride: any) => {
      setActiveRide(ride);
      setRideStatus('accepted');
      setStep('booked');
    });

    socketConn.on('ride_status_update', (data: { rideUuid: string; status: string }) => {
      setRideStatus(data.status);
      if (data.status === 'ended') {
        setTimeout(() => {
          setStep('list');
          setActiveRide(null);
          setRideStatus('');
        }, 3000);
      }
    });

    return () => {
      socketConn.disconnect();
    };
  }, [user, dispatch, router]);

  useEffect(() => {
    let animationFrame: number;
    if (step === 'booked') {
      if (rideStatus === 'arriving') {
        setCarProgress(0);
      } else if (rideStatus === 'started') {
        let start: number | null = null;
        const animate = (timestamp: number) => {
          if (!start) start = timestamp;
          const elapsed = timestamp - start;
          const progress = Math.min(elapsed / 5000, 1);
          setCarProgress(progress);
          if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
          }
        };
        animationFrame = requestAnimationFrame(animate);
      }
    } else {
      setCarProgress(0);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [step, rideStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const locations = [
      { name: 'MG Road', x: 100, y: 150 },
      { name: 'Airport', x: 450, y: 350 },
      { name: 'Kalka', x: 250, y: 80 },
      { name: 'Sector 62', x: 500, y: 120 },
      { name: 'Downtown', x: 150, y: 400 },
    ];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '12px Inter, sans-serif';
    locations.forEach((loc) => {
      ctx.beginPath();
      ctx.arc(loc.x, loc.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText(loc.name, loc.x + 8, loc.y + 4);
    });

    const getCoords = (locName: string) => {
      const found = locations.find((l) => locName?.toLowerCase().includes(l.name.toLowerCase()));
      if (found) return { x: found.x, y: found.y };
      return { x: 300, y: 250 };
    };

    let pCoords = activeRide ? getCoords(activeRide.pickupLocation) : null;
    let dCoords = activeRide ? getCoords(activeRide.dropoffLocation) : null;

    if (pCoords && dCoords) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pCoords.x, pCoords.y);
      ctx.lineTo(dCoords.x, dCoords.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (pCoords) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pCoords.x, pCoords.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('P', pCoords.x - 3, pCoords.y + 3);
    }

    if (dCoords) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(dCoords.x, dCoords.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('D', dCoords.x - 4, dCoords.y + 3);
    }

    if (step === 'booked' && pCoords && dCoords) {
      if (rideStatus === 'arriving') {
        const startX = pCoords.x - 50;
        const startY = pCoords.y - 50;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Inter, sans-serif';
        ctx.fillText('You', startX - 12, startY - 10);
      } else if (rideStatus === 'started') {
        const currentX = pCoords.x + (dCoords.x - pCoords.x) * carProgress;
        const currentY = pCoords.y + (dCoords.y - pCoords.y) * carProgress;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillText('CAR', currentX - 8, currentY + 3);
      }
    }
  }, [activeRide, step, rideStatus, carProgress]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push('/login');
  };

  const handleAcceptRequest = (req: RideRequestObj) => {
    if (socket) {
      socket.emit('driver_accept_counter', {
        requestUuid: req.uuid,
        riderUuid: req.rider.uuid,
        driverUuid: user.uuid,
        price: req.fare,
      });
    }
  };

  const handleCounterOffer = (req: RideRequestObj) => {
    const customPrice = counterPrices[req.uuid];
    if (!customPrice) return;

    if (socket) {
      socket.emit('driver_counter_offer', {
        requestUuid: req.uuid,
        driverUuid: user.uuid,
        driverEmail: user.email,
        price: parseFloat(customPrice),
      });

      setRequests((prev) =>
        prev.map((r) => {
          if (r.uuid === req.uuid) {
            return { ...r, passengerCountered: false };
          }
          return r;
        })
      );
    }
  };

  const handleIgnoreRequest = (req: RideRequestObj) => {
    setRequests((prev) => prev.filter((r) => r.uuid !== req.uuid));
  };

  return (
    <Box className={styles.dashboard}>
      <Box className={styles.header}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
          inDrive (Driver)
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <BasicSelect />
          <Button variant="outlined" color="error" onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 'auto', marginRight: 1, color: 'inherit' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </Button>
        </Box>
      </Box>

      <Box className={styles.mainLayout}>
        <Box className={styles.leftPanel}>
          {step === 'list' && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, marginBottom: 2 }}>
                Live Ride Requests
              </Typography>
              {requests.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4 }}>
                  No live requests in your area right now.
                </Typography>
              ) : (
                requests.map((req) => (
                  <Card key={req.uuid} className={styles.requestCard}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Passenger: {req.rider.email}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, margin: '4px 0' }}>
                        From: {req.pickupLocation}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, margin: '4px 0' }}>
                        To: {req.dropoffLocation}
                      </Typography>
                      {req.notes && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', margin: '4px 0' }}>
                          Note: "{req.notes}"
                        </Typography>
                      )}
                      <Typography variant="h6" sx={{ fontWeight: 700, marginTop: 1, color: req.passengerCountered ? '#fbbf24' : '#22c55e' }}>
                        Offer: ₹{req.fare} {req.passengerCountered && '(Countered by Passenger)'}
                      </Typography>
                    </Box>
                    <Box className={styles.actions}>
                      <Button
                        size="small"
                        variant="contained"
                        className={styles.acceptBtn}
                        onClick={() => handleAcceptRequest(req)}
                      >
                        Accept
                      </Button>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Price"
                          type="number"
                          value={counterPrices[req.uuid] || ''}
                          onChange={(e) =>
                            setCounterPrices((prev) => ({
                              ...prev,
                              [req.uuid]: e.target.value,
                            }))
                          }
                          className={styles.inputField}
                          sx={{ flex: 1 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          className={styles.counterBtn}
                          onClick={() => handleCounterOffer(req)}
                          disabled={!counterPrices[req.uuid]}
                        >
                          Counter
                        </Button>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        className={styles.ignoreBtn}
                        onClick={() => handleIgnoreRequest(req)}
                      >
                        Ignore
                      </Button>
                    </Box>
                  </Card>
                ))
              )}
            </Box>
          )}

          {step === 'booked' && (
            <Box className={styles.statusCard}>
              <Typography variant="h6" sx={{ color: '#22c55e', fontWeight: 600 }}>
                Ride Booked!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', margin: '8px 0' }}>
                Passenger: {activeRide?.rider?.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Pickup: {activeRide?.pickupLocation}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Dropoff: {activeRide?.dropoffLocation}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, margin: '8px 0' }}>
                Price: ₹{activeRide?.fare}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                <CircularProgress size={20} color="success" />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {rideStatus === 'accepted' && 'Driving to passenger location'}
                  {rideStatus === 'arriving' && 'Arriving at passenger location'}
                  {rideStatus === 'started' && 'Ride in Progress'}
                  {rideStatus === 'ended' && 'Ride Completed! Waiting for rating.'}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <Box className={styles.rightPanel}>
          <canvas ref={canvasRef} width={700} height={500} className={styles.mapContainer} />
        </Box>
      </Box>
    </Box>
  );
}