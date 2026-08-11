'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Card, CircularProgress, TextField, Typography } from '@mui/material';
import Logout from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/store';
import { logoutThunk } from '@/features/users/user.action';
import BasicSelect from '@/components/role-select';
import FreeSolo from '@/components/auto-search';
import { io, Socket } from 'socket.io-client';
import styles from './dashboard.module.css';
import { getRides } from '@/services/ride.service'

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

type LocationOption = {
  label: string;
  placeName: string;
  coordinates?: [number, number];
};

export default function PassengerDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.users);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeRequestUuid, setActiveRequestUuid] = useState<string | null>(null);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<RidePayload | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [rides, setRides] = useState<RideHistoryItem[]>([]);

  const [pickup, setPickup] = useState<LocationOption | null>(null);
  const [destination, setDestination] = useState<LocationOption | null>(null);
  const [fare, setFare] = useState('');
  const [notes, setNotes] = useState('');
  const [noteError, setNoteError] = useState('');

  const [step, setStep] = useState<'search' | 'finding' | 'negotiating' | 'booked' | 'review'>('search');

  const [counterInputs, setCounterInputs] = useState<{ [driverUuid: string]: string }>({});


  useEffect(() => {
    if (!user?.uuid) {
      return;
    }

    const socketConn = io('http://localhost:8000');
    socketRef.current = socketConn;
    socketConn.emit('join', { uuid: user.uuid, role: 'passenger' });

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
      setActiveRequestUuid((current) => current ?? data.rideUuid);
      if (data.status === 'ended') {
        setTimeout(() => {
          setStep('review');
        }, 2000);
      }
    });

    return () => {
      socketRef.current = null;
      socketConn.disconnect();
    };
  }, [user?.uuid]);


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
  }, [user?.uuid]);



  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push('/login');
  };

  const handleFindDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup?.coordinates || !destination?.coordinates || !pickup.label || !destination.label || !fare) return;
    if (notes.length > 50) {
      setNoteError('Notes must be 50 characters or less');
      return;
    }

    setNoteError('');
    setOffers([]);
    setStep('finding');

    socketRef.current?.emit(
      'request_ride',
      {
        riderUuid: user.uuid,
        pickupLocation: pickup.label,
        pickupLatitude: pickup.coordinates[0],
        pickupLongitude: pickup.coordinates[1],
        dropoffLocation: destination.label,
        dropoffLatitude: destination.coordinates[0],
        dropoffLongitude: destination.coordinates[1],
        fare: parseFloat(fare),
        notes,
      },
      (response: any) => {
        if (response && response.uuid) {
          setActiveRequestUuid(response.uuid);
        }
      },
    );
  };

  const handleAcceptOffer = (offer: Offer) => {
    socketRef.current?.emit('passenger_accept_offer', {
      requestUuid: offer.requestUuid,
      driverUuid: offer.driver.uuid,
      price: offer.price,
    });
  };

  const handleCounterBack = (offer: Offer) => {
    const priceVal = counterInputs[offer.driver.uuid];
    if (!priceVal) return;

    socketRef.current?.emit('passenger_counter_back', {
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
  };

  const handleIgnoreOffer = (offer: Offer) => {
    setOffers((prev) => prev.filter((o) => o.driver.uuid !== offer.driver.uuid));
  };


  return (
    <Box className={styles.dashboard}>
      <Box className={styles.header}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          InDrive
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <BasicSelect />
          <Button variant="outlined" sx={{ color: 'white', borderColor: 'white' }} onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 'auto', marginRight: 1 }}>
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
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'black' }}>
                Request a Ride
              </Typography>
              <form
                className={styles.formBox}
                onSubmit={handleFindDriver}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', border: '1px solid #4741413f', borderRadius: '8px' }}
              >
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
                  disabled={!pickup?.coordinates || !destination?.coordinates || !fare || !!noteError}
                >
                  Find Me Driver
                </Button>
              </form>
            </Box>
          )}

          {step === 'finding' && (
            <Box className={styles.statusCard} sx={{ color: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, border: '1px solid #4741413f', borderRadius: '8px', padding: '1rem' }}>
              <CircularProgress color="success" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Finding nearby drivers...
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(15, 15, 15, 0.84)' }}>
                Waiting for offers at ₹{fare}.
              </Typography>
            </Box>
          )}

          {offers.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, marginBottom: 2, color: 'black' }}>
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
                      <Typography variant="caption" sx={{ color: 'black', display: 'block', marginBottom: 1 }}>
                        You countered back with ₹{offer.counteredPrice}
                      </Typography>
                    )}
                  </Box>
                  {offer.status !== 'countered' ? (
                    <Box>

                      <Box className={styles.offerActions}>
                        <Button
                          size="small"
                          variant="contained"
                          className={styles.acceptBtn}
                          onClick={() => handleAcceptOffer(offer)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          className={styles.ignoreBtn}
                          onClick={() => handleIgnoreOffer(offer)}
                        >
                          Ignore
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1, mt: 2 }}>
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
                    </Box>
                  ) : (
                    <Box>

                      <Box className={styles.offerActions}>
                        <Button
                          size="small"
                          variant="contained"
                          className={styles.acceptBtn}
                          onClick={() => handleAcceptOffer(offer)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          className={styles.ignoreBtn}
                          onClick={() => handleIgnoreOffer(offer)}
                        >
                          Ignore
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flex: 1, mt: 2 }}>
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
                    </Box>
                  )}
                </Card>
              ))}
            </Box>
          )}

          {(activeRide || rideStatus) && (
            <Box className={styles.statusCard} sx={{ color: 'black', marginTop: 2, border: '1px solid #4741413f', borderRadius: '8px', padding: '1rem', backgroundColor: '#f7f4f4da' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Current Ride
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(29, 27, 27, 0.7)' }}>
                Request: {activeRequestUuid || 'Waiting for confirmation'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(24, 22, 22, 0.7)' }}>
                Status: {rideStatus || activeRide?.status || 'pending'}
              </Typography>
              {activeRide && (
                <Typography variant="body2" sx={{ color: 'rgba(22, 21, 21, 0.7)' }}>
                  Driver: {activeRide.driver?.email ?? 'Assigning...'}
                </Typography>
              )}
            </Box>
          )}





        </Box>

        {/* show all previous rides in a list */}
        <Box className={styles.rightPanel}>

          {rides.length > 0 ? (
            <Box className={styles.statusCard} sx={{ width: '100%', color: 'black', marginTop: 2, border: '1px solid #4741413f', borderRadius: '8px', padding: '1rem', backgroundColor: '#3d333313', height: '85vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              {rides.map((ride) => (
                <Box key={ride.uuid} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, paddingY: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(24, 22, 22, 0.8)' }}>
                    {ride.pickupLocation} to {ride.dropoffLocation}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(24, 22, 22, 0.65)' }}>
                    Status: {ride.status} · ₹{ride.fare}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box className={styles.statusCard} sx={{ width: '100%', color: 'black', marginTop: 2, border: '1px solid #4741413f', borderRadius: '8px', padding: '1rem', backgroundColor: '#3d333313', height: '85vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              <Typography variant="body2" sx={{ color: 'rgba(24, 22, 22, 0.8)' }}>
                No previous rides found.
              </Typography>
            </Box>
          )}
        </Box>


      </Box>
    </Box>
  );
}