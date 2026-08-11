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
import FreeSolo from '@/components/auto-search';
import { io, Socket } from 'socket.io-client';
import styles from './dashboard.module.css';

type Offer = {
  requestUuid: string;
  driver: {
    uuid: string;
    email: string;
  };
  price: number;
  status?: 'pending' | 'countered';
  counteredPrice?: number;
};

export default function PassengerDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.users);

  const [socket, setSocket] = useState<Socket | null>(null);

  const [pickup, setPickup] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [fare, setFare] = useState('');
  const [notes, setNotes] = useState('');
  const [noteError, setNoteError] = useState('');

  const [step, setStep] = useState<'search' | 'finding' | 'negotiating' | 'booked' | 'review'>('search');
  const [activeRequestUuid, setActiveRequestUuid] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<string>('');

  const [counterInputs, setCounterInputs] = useState<{ [driverUuid: string]: string }>({});

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

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
    socketConn.emit('join', { uuid: user.uuid, role: 'passenger' });
    setSocket(socketConn);

    socketConn.on('passenger_received_counter', (data: Offer) => {
      setOffers((prev) => {
        const filtered = prev.filter((o) => o.driver.uuid !== data.driver.uuid);
        return [...filtered, { ...data, status: 'pending' }];
      });
      setStep((curr) => (curr === 'finding' ? 'negotiating' : curr));
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
          setStep('review');
        }, 2000);
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

    let pCoords = pickup ? getCoords(pickup.label) : null;
    let dCoords = destination ? getCoords(destination.label) : null;

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
        ctx.fillText('Driver', startX - 12, startY - 10);
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
  }, [pickup, destination, step, rideStatus, carProgress]);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push('/login');
  };

  const handleFindDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !destination || !fare) return;
    if (notes.length > 50) {
      setNoteError('Notes must be 50 characters or less');
      return;
    }

    setNoteError('');
    setOffers([]);
    setStep('finding');

    if (socket) {
      socket.emit(
        'request_ride',
        {
          riderUuid: user.uuid,
          pickupLocation: pickup.label,
          dropoffLocation: destination.label,
          fare: parseFloat(fare),
          notes,
        },
        (response: any) => {
          if (response && response.uuid) {
            setActiveRequestUuid(response.uuid);
          }
        }
      );
    }
  };

  const handleAcceptOffer = (offer: Offer) => {
    if (socket) {
      socket.emit('passenger_accept_offer', {
        requestUuid: offer.requestUuid,
        driverUuid: offer.driver.uuid,
        price: offer.price,
      });
    }
  };

  const handleCounterBack = (offer: Offer) => {
    const priceVal = counterInputs[offer.driver.uuid];
    if (!priceVal) return;

    if (socket) {
      socket.emit('passenger_counter_back', {
        requestUuid: offer.requestUuid,
        driverUuid: offer.driver.uuid,
        price: parseFloat(priceVal),
      });

      setOffers((prev) =>
        prev.map((o) => {
          if (o.driver.uuid === offer.driver.uuid) {
            return { ...o, status: 'countered', counteredPrice: parseFloat(priceVal) };
          }
          return o;
        })
      );
    }
  };

  const handleIgnoreOffer = (offer: Offer) => {
    setOffers((prev) => prev.filter((o) => o.driver.uuid !== offer.driver.uuid));
  };

  const handleRatingSubmit = () => {
    if (socket && activeRide) {
      socket.emit('rate_ride', {
        rideUuid: activeRide.uuid,
        rating,
      });
    }
    setStep('search');
    setPickup(null);
    setDestination(null);
    setFare('');
    setNotes('');
    setActiveRide(null);
    setOffers([]);
  };

  return (
    <Box className={styles.dashboard}>
      <Box className={styles.header}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
          inDrive
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
          {step === 'search' && (
            <Box className={styles.formBox}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Request a Ride
              </Typography>
              <form onSubmit={handleFindDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <FreeSolo
                  label="Pickup Location"
                  placeholder="Where from?"
                  onSelect={(val) => setPickup(val)}
                />
                <FreeSolo
                  label="Destination"
                  placeholder="Where to?"
                  onSelect={(val) => setDestination(val)}
                />
                <TextField
                  label="Your Offered Fare (₹)"
                  variant="outlined"
                  type="number"
                  value={fare}
                  onChange={(e) => setFare(e.target.value)}
                  className={styles.inputField}
                  required
                  fullWidth
                />
                <TextField
                  label="Optional Notes for Driver"
                  variant="outlined"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (e.target.value.length > 50) {
                      setNoteError('Maximum 50 characters allowed');
                    } else {
                      setNoteError('');
                    }
                  }}
                  error={!!noteError}
                  helperText={noteError || `${notes.length}/50`}
                  className={styles.inputField}
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  className={styles.bookButton}
                  fullWidth
                  disabled={!pickup || !destination || !fare || !!noteError}
                >
                  Find Me Driver
                </Button>
              </form>
            </Box>
          )}

          {step === 'finding' && (
            <Box className={styles.statusCard}>
              <CircularProgress color="success" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Finding nearby drivers...
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Waiting for offers at ₹{fare}.
              </Typography>
            </Box>
          )}

          {step === 'negotiating' && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 2 }}>
                Driver Counter Offers
              </Typography>
              {offers.map((offer) => (
                <Card key={offer.driver.uuid} className={styles.offerItem}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Driver: {offer.driver.email}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, margin: '8px 0' }}>
                      Fare: ₹{offer.price}
                    </Typography>
                    {offer.status === 'countered' && (
                      <Typography variant="caption" sx={{ color: '#fbbf24', display: 'block', marginBottom: 1 }}>
                        You countered back with ₹{offer.counteredPrice}
                      </Typography>
                    )}
                  </Box>
                  {offer.status !== 'countered' ? (
                    <Box className={styles.offerActions}>
                      <Button
                        size="small"
                        variant="contained"
                        className={styles.acceptBtn}
                        onClick={() => handleAcceptOffer(offer)}
                      >
                        Accept
                      </Button>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Price"
                          type="number"
                          value={counterInputs[offer.driver.uuid] || ''}
                          onChange={(e) =>
                            setCounterInputs((prev) => ({
                              ...prev,
                              [offer.driver.uuid]: e.target.value,
                            }))
                          }
                          className={styles.inputField}
                          sx={{ flex: 1 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          className={styles.counterBtn}
                          onClick={() => handleCounterBack(offer)}
                          disabled={!counterInputs[offer.driver.uuid]}
                        >
                          Counter
                        </Button>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        className={styles.ignoreBtn}
                        onClick={() => handleIgnoreOffer(offer)}
                      >
                        Ignore
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleIgnoreOffer(offer)}
                      fullWidth
                    >
                      Cancel / Ignore
                    </Button>
                  )}
                </Card>
              ))}
            </Box>
          )}

          {step === 'booked' && (
            <Box className={styles.statusCard}>
              <Typography variant="h6" className={styles.activeRideText}>
                Ride Booked Successfully!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', margin: '8px 0' }}>
                Riding with: {activeRide?.driver?.email}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Fare: ₹{activeRide?.fare}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
                <CircularProgress size={20} color="success" />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {rideStatus === 'accepted' && 'Driver is 2 minutes away'}
                  {rideStatus === 'arriving' && 'Driver is 2 minutes away'}
                  {rideStatus === 'started' && 'Ride Started'}
                  {rideStatus === 'ended' && 'Ride Ended'}
                </Typography>
              </Box>
            </Box>
          )}

          {step === 'review' && (
            <Box className={styles.statusCard}>
              <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'center' }}>
                Rate Your Driver
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 2 }}>
                Please rate your experience with {activeRide?.driver?.email}
              </Typography>
              <Box className={styles.ratingBox}>
                <Box className={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`${styles.star} ${
                        (hoverRating !== null ? star <= hoverRating : star <= rating) ? styles.starActive : ''
                      }`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      ★
                    </span>
                  ))}
                </Box>
                <Button
                  variant="contained"
                  className={styles.bookButton}
                  onClick={handleRatingSubmit}
                  fullWidth
                >
                  Submit Rating
                </Button>
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