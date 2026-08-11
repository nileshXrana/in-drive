export interface User {
  uuid: string;
  email: string;
  role: 'passenger' | 'driver';
}

export type loginFormData = {
  email: string;
  password: string;
};

export type signupFormData = {
  email: string;
  password: string;
};

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
