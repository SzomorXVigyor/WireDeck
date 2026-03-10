import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';
import router from '../router';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and surface API errors as toasts
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      await authStore.logout();
      router.push('/login');
      return Promise.reject(error);
    }

    // Skip toast when the caller opted out (e.g. login form handles its own errors)
    if ((error.config as any)?._suppressToast) {
      return Promise.reject(error);
    }

    const data = error.response?.data as Record<string, unknown> | undefined;
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(' · ')
      : typeof rawMessage === 'string' && rawMessage
        ? rawMessage
        : error.message || 'An unexpected error occurred';

    const status = error.response?.status ?? 0;
    const type = status >= 500 ? 'error' : status === 409 ? 'warning' : 'error';

    useToastStore().push(message, type);

    return Promise.reject(error);
  }
);

export default api;
