import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import api from '../services/api';
import type { Device } from '../types/device';

export const useDevicesStore = defineStore('devices', () => {
  const devices: Ref<Device[]> = ref([]);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  /** Fetch all device entries (`GET /api/devices`). */
  const fetchDevices = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<Device[]>('/devices');
      devices.value = response.data;
    } catch (err: unknown) {
      error.value =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch devices';
      console.error('Error fetching devices:', err);
    } finally {
      loading.value = false;
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────

  /** Create a new device entry (`POST /api/device/new`). */
  const createDevice = async (data: Omit<Device, 'id'>): Promise<Device> => {
    const response = await api.post<Device>('/device/new', data);
    devices.value.push(response.data);
    return response.data;
  };

  // ── Update ────────────────────────────────────────────────────────────────

  /** Update an existing device entry (`PUT /api/device/:id`). */
  const updateDevice = async (id: number, data: Omit<Device, 'id'>): Promise<void> => {
    const response = await api.put<Device>(`/device/${id}`, data);
    const idx = devices.value.findIndex((d) => d.id === id);
    if (idx !== -1) devices.value[idx] = response.data;
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  /** Delete a device entry (`DELETE /api/device/:id`). */
  const deleteDevice = async (id: number): Promise<void> => {
    await api.delete(`/device/${id}`);
    devices.value = devices.value.filter((d) => d.id !== id);
  };

  return {
    devices,
    loading,
    error,
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,
  };
});
