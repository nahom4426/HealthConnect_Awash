import { getActingRole, roleSwitcherEnabled } from '@/utils/actingRole';
import { useAuthStore } from '@/stores/auth';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'proposal' | 'claim' | 'payment' | 'inspection' | 'system';
  isRead: boolean;
  link?: string;
  badge?: string;
}

const notificationsUrl = `${import.meta.env.VITE_NOTIFICATION_HOST}/api/payer/motor/digital-channel/notifications`;

// Same bearer token as the rest of the digital-channel calls (see digitalChannelApi.js)
function authHeaders() {
  const auth = useAuthStore();
  const token = auth.auth?.token || auth.auth?.user?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const useNotificationStore = defineStore('notifications', () => {
  // Filled from the backend by fetchNotifications(); no demo items
  const notifications = ref<NotificationItem[]>([]);

  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

  async function fetchNotifications() {
    try {
      const role = getActingRole() || (roleSwitcherEnabled ? 'ROLE_UNDERWRITER' : '');
      const res = await axios.get(notificationsUrl, {
        params: { role },
        headers: authHeaders()
      });
      if (Array.isArray(res.data)) {
        notifications.value = res.data.map((item: any) => ({
          id: String(item.id ?? item.uuid ?? `notif-${Math.random()}`),
          title: item.title || 'System Alert',
          message: item.message || '',
          timestamp: item.timestamp || item.createdAt || '',
          type: item.type || 'system',
          isRead: item.isRead === true || item.read === true,
          link: item.link || '',
          badge: item.type ? item.type.toUpperCase() : 'ALERT'
        }));
      }
    } catch (e) {
      // Keep what is already shown; the next poll retries
      console.warn('Could not load notifications:', e);
    }
  }

  async function markAsRead(id: string) {
    const item = notifications.value.find(n => n.id === id);
    if (item) {
      item.isRead = true;
    }
    try {
      await axios.put(`${notificationsUrl}/${id}/read`, {}, { headers: authHeaders() });
    } catch (ignored) {}
  }

  async function markAllAsRead() {
    notifications.value.forEach(n => {
      n.isRead = true;
    });
    try {
      await axios.put(`${notificationsUrl}/read-all`, {}, { headers: authHeaders() });
    } catch (ignored) {}
  }

  function addNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      isRead: false
    };
    notifications.value.unshift(newNotif);
  }

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => {
      if (a.isRead === b.isRead) return 0;
      return a.isRead ? 1 : -1;
    });
  });

  function removeNotification(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id);
  }

  function clearAll() {
    notifications.value = [];
  }

  function clearRead() {
    notifications.value = notifications.value.filter(n => !n.isRead);
  }

  return {
    notifications,
    sortedNotifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    clearAll,
    clearRead
  };
});

