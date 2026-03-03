import { defineStore } from 'pinia';
import { ref, computed, Ref } from 'vue';
import api from '../services/api';

interface User {
  id: string | number;
  username: string;
  email?: string;
  [key: string]: any;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
  message?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token: Ref<string | null> = ref(localStorage.getItem('auth_token'));
  const user: Ref<User | null> = ref(null);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  const initializeAuth = async (): Promise<void> => {
    if (token.value) {
      try {
        const response = await api.get<{ user: User }>('/auth/profile');
        user.value = response.data.user;
      } catch (err) {
        console.error('Error fetching user profile:', err);
        logout();
      }
    }
  };

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    loading.value = true;
    error.value = null;

    try {
      // Prevent Axios from throwing on 4xx/5xx
      const response = await api.post<LoginResponse>('/auth/login', credentials, {
        validateStatus: () => true,
      });

      if (response.status === 201 && response.data.access_token) {
        const { access_token, user: userData } = response.data;
        token.value = access_token;
        user.value = userData;
        localStorage.setItem('auth_token', access_token);

        return { success: true };
      } else {
        // Handle failed login gracefully without reload
        error.value = response.data.message || 'Invalid credentials';
        return { success: false, error: error.value };
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    }

    token.value = null;
    user.value = null;
    localStorage.removeItem('auth_token');
  };

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    initializeAuth,
    login,
    logout,
  };
});
