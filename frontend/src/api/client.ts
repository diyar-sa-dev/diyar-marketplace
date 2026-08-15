import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { env } from '../lib/env.ts';
import type { ApiErrorResponse } from '../types/api.ts';
import { parseApiError } from '../utils/errors.ts';

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30_000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    return Promise.reject(parseApiError(error));
  },
);
