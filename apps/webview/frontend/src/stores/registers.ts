import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import api from '../services/api';
import type { RegisterDictEntry } from '../types/register';

export const useRegistersStore = defineStore('registers', () => {
  const registers: Ref<RegisterDictEntry[]> = ref([]);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  /** Fetch all register dictionary entries (`GET /api/registers`). */
  const fetchRegisters = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<RegisterDictEntry[]>('/registers');
      registers.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch registers';
      console.error('Error fetching registers:', err);
    } finally {
      loading.value = false;
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────

  /** Create a new register entry (`POST /api/register/new`). */
  const createRegister = async (data: Omit<RegisterDictEntry, 'id'>): Promise<RegisterDictEntry> => {
    const response = await api.post<RegisterDictEntry>('/register/new', data);
    registers.value.push(response.data);
    return response.data;
  };

  // ── Update ────────────────────────────────────────────────────────────────

  /** Update an existing register entry (`PUT /api/register/:id`). */
  const updateRegister = async (id: number, data: Omit<RegisterDictEntry, 'id'>): Promise<void> => {
    const response = await api.put<RegisterDictEntry>(`/register/${id}`, data);
    const idx = registers.value.findIndex((r) => r.id === id);
    if (idx !== -1) registers.value[idx] = response.data;
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  /** Delete a register entry (`DELETE /api/register/:id`). */
  const deleteRegister = async (id: number): Promise<void> => {
    await api.delete(`/register/${id}`);
    registers.value = registers.value.filter((r) => r.id !== id);
  };

  return {
    registers,
    loading,
    error,
    fetchRegisters,
    createRegister,
    updateRegister,
    deleteRegister,
  };
});
