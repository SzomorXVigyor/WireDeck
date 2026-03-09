import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import api from '../services/api';
import type { ViewSummary, ViewDetail, RegisterEntry } from '../types/view';

export const useViewsStore = defineStore('views', () => {
  const views: Ref<ViewSummary[]> = ref([]);
  const currentView: Ref<ViewDetail | null> = ref(null);
  const loadingViews: Ref<boolean> = ref(false);
  const loadingView: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  /** Map of register address → current value for the active view. */
  const registerData: Ref<Map<number, number>> = ref(new Map());

  /** Internal timer handle for auto-polling. */
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  // ── Views list ────────────────────────────────────────────────────────────

  /** Fetch the list of all available views (`GET /api/views`). */
  const fetchViews = async (): Promise<void> => {
    loadingViews.value = true;
    error.value = null;
    try {
      const response = await api.get<ViewSummary[]>('/views');
      views.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch views';
      console.error('Error fetching views:', err);
    } finally {
      loadingViews.value = false;
    }
  };

  // ── View detail ───────────────────────────────────────────────────────────

  /** Fetch full detail for a single view (`GET /api/view/:id`). */
  const fetchView = async (id: number | string): Promise<void> => {
    loadingView.value = true;
    error.value = null;
    try {
      const response = await api.get<ViewDetail>(`/view/${id}`);
      currentView.value = response.data;
      registerData.value = new Map(); // clear stale data on view switch
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch view';
      console.error('Error fetching view:', err);
    } finally {
      loadingView.value = false;
    }
  };

  // ── Register data ─────────────────────────────────────────────────────────

  /**
   * Fetch current register values for the active view.
   * `POST /api/view/:id/data/query` with body `{ registers: number[] }` → `{ register, value }[]`
   * The register list is derived from the currently loaded view's card components.
   */
  const fetchRegisterData = async (viewId: number | string): Promise<void> => {
    try {
      const registers = (currentView.value?.components ?? []).map((c) => c.register);
      const response = await api.post<RegisterEntry[]>(`/view/${viewId}/data/query`, { registers });
      const map = new Map<number, number>();
      for (const entry of response.data) {
        map.set(entry.register, entry.value);
      }
      registerData.value = map;
    } catch (err: any) {
      console.error('Error fetching register data:', err);
    }
  };

  /**
   * Write a single register value.
   * `POST /api/view/:id/data` with body `{ register, value }`
   */
  const writeRegisterData = async (viewId: number | string, register: number, value: number): Promise<void> => {
    try {
      await api.post(`/view/${viewId}/data`, { register, value });
      // Optimistically update local cache
      const next = new Map(registerData.value);
      next.set(register, value);
      registerData.value = next;
    } catch (err: any) {
      console.error('Error writing register data:', err);
    }
  };

  // ── View CRUD ─────────────────────────────────────────────────────────────

  /** Create a new empty view (`POST /api/view/new`). Returns the created view. */
  const createView = async (): Promise<ViewDetail> => {
    const response = await api.post<ViewDetail>('/view/new');
    views.value.push({ id: response.data.id, name: response.data.name });
    return response.data;
  };

  /** Persist edits to an existing view (`PUT /api/view/:id`). Updates local state. */
  const updateView = async (id: number | string, data: ViewDetail): Promise<void> => {
    try {
      await api.put(`/view/${id}`, data);
      currentView.value = { ...data };
      const idx = views.value.findIndex((v) => v.id === Number(id));
      if (idx !== -1) views.value[idx] = { id: Number(id), name: data.name };
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update view';
      console.error('Error updating view:', err);
      throw err;
    }
  };

  /** Delete a view (`DELETE /api/view/:id`). Removes it from the local list. */
  const deleteView = async (id: number | string): Promise<void> => {
    try {
      await api.delete(`/view/${id}`);
      views.value = views.value.filter((v) => v.id !== Number(id));
      if (currentView.value?.id === Number(id)) {
        currentView.value = null;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete view';
      console.error('Error deleting view:', err);
      throw err;
    }
  };

  // ── Polling ───────────────────────────────────────────────────────────────
  /**
   * Start automatic polling for `viewId` at the given interval (seconds).
   * Stops any previously running timer first.
   */
  const startPolling = (viewId: number | string, intervalSeconds: number): void => {
    stopPolling();
    if (intervalSeconds <= 0) return;
    fetchRegisterData(viewId); // immediate first fetch
    pollTimer = setInterval(() => fetchRegisterData(viewId), intervalSeconds * 1000);
  };

  /** Stop the active polling timer. */
  const stopPolling = (): void => {
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  return {
    views,
    currentView,
    loadingViews,
    loadingView,
    error,
    registerData,
    fetchViews,
    fetchView,
    fetchRegisterData,
    writeRegisterData,
    createView,
    updateView,
    deleteView,
    startPolling,
    stopPolling,
  };
});
