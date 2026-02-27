import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useHealthStore = defineStore('health', () => {
  const health = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchHealth = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/health');
      health.value = response.data;
    } catch (err) {
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
