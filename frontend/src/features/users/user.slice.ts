import { createSlice } from '@reduxjs/toolkit';
import { UserState } from './user.type';
import { loginThunk, signupThunk, logoutThunk, getUserThunk } from './user.action';

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      // signup
      .addCase(signupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      // logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
      })


      // getUser
      .addCase(getUserThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
