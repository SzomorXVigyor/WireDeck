import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import api from '../services/api';

interface HealthStatus {
  status: string;
  timestamp?: string;
  uptime?: number;
  [key: string]: any;
}

export const useHealthStore = defineStore('health', () => {
  const health: Ref<HealthStatus | null> = ref(null);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  const fetchHealth = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<HealthStatus>('/health');
      health.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch health status';
      console.error('Error fetching health:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    health,
    loading,
    error,
    fetchHealth,
  };
});
