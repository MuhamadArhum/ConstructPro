import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthenticatedUser, LoginResponse } from '../../types/auth.types';
import { tokenStorage } from '../../utils/tokenStorage';

interface AuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: tokenStorage.getUser(),
  isAuthenticated: Boolean(tokenStorage.getAccessToken()),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      const { accessToken, refreshToken, userId, email, fullName, profilePicturePath, roles, permissions } =
        action.payload;
      const user: AuthenticatedUser = { userId, email, fullName, profilePicturePath, roles, permissions };
      tokenStorage.setTokens(accessToken, refreshToken);
      tokenStorage.setUser(user);
      state.user = user;
      state.isAuthenticated = true;
    },
    clearCredentials: (state) => {
      tokenStorage.clearTokens();
      state.user = null;
      state.isAuthenticated = false;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthenticatedUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        tokenStorage.setUser(state.user);
      }
    },
  },
});

export const { setCredentials, clearCredentials, updateUser } = authSlice.actions;
export default authSlice.reducer;
