import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useConfigStore = defineStore('config', () => {
  const config = ref({
    features: {
      passwordChange: false,
    },
  });
  const loading = ref(false);
  const error = ref(null);

  const fetchConfig = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/config');
      config.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch configuration';
      console.error('Error fetching config:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    config,
    loading,
    error,
    fetchConfig,
  };
});
