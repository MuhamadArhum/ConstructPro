import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { tokenStorage } from '../utils/tokenStorage';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  const accessToken = tokenStorage.getAccessToken();
  if (!refreshToken || !accessToken) {
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      accessToken,
      refreshToken,
    });
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
    tokenStorage.setTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
  } catch {
    tokenStorage.clearTokens();
    return null;
  }
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If there's no refresh token the request was unauthenticated (e.g. login itself
      // returned 401). Propagate the error so the caller can show the proper message.
      if (!tokenStorage.getRefreshToken()) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return axiosClient(originalRequest);
      }

      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
