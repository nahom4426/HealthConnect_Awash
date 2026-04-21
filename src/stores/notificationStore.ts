import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  read: boolean;
  icon?: string;
  action?: {
    label: string;
    callback: () => void;
  };
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([]);
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);
  const totalCount = computed(() => notifications.value.length);

  // Add a new notification
  function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    };
    notifications.value.unshift(newNotification);
    return id;
  }

  // Mark notification as read
  function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  // Mark all as read
  function markAllAsRead() {
    notifications.value.forEach(n => {
      n.read = true;
    });
  }

  // Remove notification
  function removeNotification(id: string) {
    notifications.value = notifications.value.filter(n => n.id !== id);
  }

  // Clear all notifications
  function clearAll() {
    notifications.value = [];
  }

  // Clear read notifications
  function clearRead() {
    notifications.value = notifications.value.filter(n => !n.read);
  }

  // Get notifications sorted by timestamp
  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });

  return {
    notifications,
    unreadCount,
    totalCount,
    sortedNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    clearRead,
  };
});
