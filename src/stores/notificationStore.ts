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

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'New Motor Proposal Submitted',
      message: 'Solomon Tadesse submitted proposal #NYA-PROP-881923 for Toyota Land Cruiser LC300.',
      timestamp: '10 mins ago',
      type: 'proposal',
      isRead: false,
      link: '/motor/proposals/PROP-2026-001',
      badge: 'New Proposal'
    },
    {
      id: 'notif-2',
      title: 'EthioTelecom TP Payment Confirmed',
      message: 'Payment of ETB 1,250.00 verified. Reference: ETHIO-TP-881923.',
      timestamp: '25 mins ago',
      type: 'payment',
      isRead: false,
      link: '/motor/proposals/PROP-2026-001',
      badge: 'Payment OK'
    },
    {
      id: 'notif-3',
      title: 'Pre-Insurance Inspection Passed',
      message: 'Adjustor Dawit Tesfaye approved vehicle condition for #NYA-PROP-772910.',
      timestamp: '1 hour ago',
      type: 'inspection',
      isRead: false,
      link: '/motor/proposals/PROP-2026-002',
      badge: 'Inspection OK'
    }
  ]);

  const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);

  async function fetchNotifications() {
    try {
      const role = localStorage.getItem('standard_active_testing_role') || localStorage.getItem('user_role') || localStorage.getItem('role') || 'UNDERWRITER';
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_NOTIFICATION_HOST;
      const res = await axios.get(`${baseUrl}/api/payer/motor/digital-channel/notifications`, {
        params: { role },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        notifications.value = res.data.map((item: any) => ({
          id: item.id || `notif-${Math.random()}`,
          title: item.title || 'System Alert',
          message: item.message || '',
          timestamp: item.timestamp || 'Just now',
          type: item.type || 'system',
          isRead: item.isRead === true,
          link: item.link || '',
          badge: item.type ? item.type.toUpperCase() : 'ALERT'
        }));
      }
    } catch (e) {
      console.warn('Backend notification sync fallback to local cache:', e);
    }
  }

  async function markAsRead(id: string) {
    const item = notifications.value.find(n => n.id === id);
    if (item) {
      item.isRead = true;
    }
    try {
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_NOTIFICATION_HOST;
      await axios.put(`${baseUrl}/api/payer/motor/digital-channel/notifications/${id}/read`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (ignored) {}
  }

  async function markAllAsRead() {
    notifications.value.forEach(n => {
      n.isRead = true;
    });
    try {
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_NOTIFICATION_HOST;
      await axios.put(`${baseUrl}/api/payer/motor/digital-channel/notifications/read-all`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
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

