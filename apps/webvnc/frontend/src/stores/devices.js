import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useDevicesStore = defineStore('devices', () => {
  const devices = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchDevices = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/vnc/devices');
      devices.value = response.data.devices;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch devices';
      console.error('Error fetching devices:', err);
    } finally {
      loading.value = false;
    }
  };

  const getDeviceByName = (name) => {
    return devices.value.find((device) => device.name === name);
  };

  return {
    devices,
    loading,
    error,
    fetchDevices,
    getDeviceByName,
  };
});
