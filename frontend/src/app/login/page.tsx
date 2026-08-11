'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginThunk } from '@/features/users/user.action';
import { AppDispatch } from '@/store';
import styles from './login.module.css';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: any) => state.users);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const resultAction = await dispatch(loginThunk(values));
    if (loginThunk.fulfilled.match(resultAction)) {
      router.push('/dashboard');
    }
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.card}>
        <Typography variant="h4" className={styles.title}>
          InDrive
        </Typography>
        
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            className={styles.input}
            fullWidth
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            className={styles.input}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            className={styles.button}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
        <Typography className={styles.linkText}>
          Don't have an account?{' '}
          <Link href="/signup" className={styles.link}>
            Sign Up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
