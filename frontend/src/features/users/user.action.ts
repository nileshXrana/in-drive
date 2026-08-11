import { createAsyncThunk } from '@reduxjs/toolkit';
import { login, signup, logout } from '@/services/auth.service';
import { getUser } from '@/services/user.service';
import { loginFormData, signupFormData } from './user.type';

export const loginThunk = createAsyncThunk(
  'users/login',
  async (data: loginFormData, { rejectWithValue }) => {
    try {
      const response = await login(data);
      return response.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const signupThunk = createAsyncThunk(
  'users/signup',
  async (data: signupFormData, { rejectWithValue }) => {
    try {
      const response = await signup(data);
      return response.user;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Signup failed');
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'users/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout();
      return null;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Logout failed');
    }
  }
);

export const getUserThunk = createAsyncThunk(
  'users/getUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUser();
      return response;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
    }
  }
);
