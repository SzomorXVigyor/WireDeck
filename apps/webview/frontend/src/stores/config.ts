import { defineStore } from 'pinia';
import { ref, Ref } from 'vue';
import api from '../services/api';

interface ConfigFeatures {
  passwordChange: boolean;
  [key: string]: any;
}

interface Config {
  features: ConfigFeatures;
  [key: string]: any;
}

export const useConfigStore = defineStore('config', () => {
  const config: Ref<Config> = ref({
    features: {
      passwordChange: false,
    },
  });
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  const fetchConfig = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<Config>('/config');
      config.value = response.data;
    } catch (err: any) {
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
