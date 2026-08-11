'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { signupThunk } from '@/features/users/user.action';
import { AppDispatch } from '@/store';
import styles from './signup.module.css';

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { loading, error } = useSelector((state: any) => state.users);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password || !confirmPassword) {
      setLocalError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    const resultAction = await dispatch(signupThunk({ email, password }));
    if (signupThunk.fulfilled.match(resultAction)) {
      router.push('/dashboard');
    }
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.card}>
        <Typography variant="h4" className={styles.title}>
          inDrive Sign Up
        </Typography>
        {(localError || error) && (
          <Typography className={styles.error}>
            {localError || error}
          </Typography>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            fullWidth
            required
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            fullWidth
            required
          />
          <TextField
            label="Confirm Password"
            variant="outlined"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            fullWidth
            required
          />
          <Button
            type="submit"
            variant="contained"
            className={styles.button}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>
        <Typography className={styles.linkText}>
          Already have an account?{' '}
          <Link href="/login" className={styles.link}>
            Log In
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
