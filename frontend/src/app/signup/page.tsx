'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signupThunk } from '@/features/users/user.action';
import { AppDispatch } from '@/store';
import styles from './signup.module.css';

const signupSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: any) => state.users);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    const resultAction = await dispatch(signupThunk({ email: values.email, password: values.password }));
    if (signupThunk.fulfilled.match(resultAction)) {
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
          <TextField
            label="Confirm Password"
            variant="outlined"
            type="password"
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
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
