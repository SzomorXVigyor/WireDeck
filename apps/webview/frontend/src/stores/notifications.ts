import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import api from '../services/api';
import type { NotificationEntry } from '../types/notification';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications: Ref<NotificationEntry[]> = ref([]);
  const loading: Ref<boolean> = ref(false);
  const error: Ref<string | null> = ref(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  /** Fetch all notification entries (`GET /api/notifications`). */
  const fetchNotifications = async (): Promise<void> => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<NotificationEntry[]>('/notifications');
      notifications.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch notifications';
      console.error('Error fetching notifications:', err);
    } finally {
      loading.value = false;
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────

  /** Create a new notification entry (`POST /api/notification/new`). */
  const createNotification = async (data: Omit<NotificationEntry, 'id'>): Promise<NotificationEntry> => {
    const response = await api.post<NotificationEntry>('/notification/new', data);
    notifications.value.push(response.data);
    return response.data;
  };

  // ── Update ────────────────────────────────────────────────────────────────

  /** Update an existing notification entry (`PUT /api/notification/:id`). */
  const updateNotification = async (id: number, data: Omit<NotificationEntry, 'id'>): Promise<void> => {
    const response = await api.put<NotificationEntry>(`/notification/${id}`, data);
    const idx = notifications.value.findIndex((n) => n.id === id);
    if (idx !== -1) notifications.value[idx] = response.data;
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  /** Delete a notification entry (`DELETE /api/notification/:id`). */
  const deleteNotification = async (id: number): Promise<void> => {
    await api.delete(`/notification/${id}`);
    notifications.value = notifications.value.filter((n) => n.id !== id);
  };

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
  };
});
