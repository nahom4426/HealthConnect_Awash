import { useNotificationStore } from '@/stores/notificationStore';

export function useNotifications() {
  const store = useNotificationStore();

  /**
   * Add a success notification
   */
  function success(title: string, message: string, action?: { label: string; callback: () => void }) {
    return store.addNotification({
      title,
      message,
      type: 'success',
      icon: '✅',
      action,
    });
  }

  /**
   * Add an error notification
   */
  function error(title: string, message: string, action?: { label: string; callback: () => void }) {
    return store.addNotification({
      title,
      message,
      type: 'error',
      icon: '❌',
      action,
    });
  }

  /**
   * Add a warning notification
   */
  function warning(title: string, message: string, action?: { label: string; callback: () => void }) {
    return store.addNotification({
      title,
      message,
      type: 'warning',
      icon: '⚠️',
      action,
    });
  }

  /**
   * Add an info notification
   */
  function info(title: string, message: string, action?: { label: string; callback: () => void }) {
    return store.addNotification({
      title,
      message,
      type: 'info',
      icon: 'ℹ️',
      action,
    });
  }

  /**
   * Mark notification as read
   */
  function markAsRead(id: string) {
    store.markAsRead(id);
  }

  /**
   * Mark all as read
   */
  function markAllAsRead() {
    store.markAllAsRead();
  }

  /**
   * Remove notification
   */
  function remove(id: string) {
    store.removeNotification(id);
  }

  /**
   * Clear all notifications
   */
  function clearAll() {
    store.clearAll();
  }

  /**
   * Clear read notifications
   */
  function clearRead() {
    store.clearRead();
  }


  return {
    success,
    error,
    warning,
    info,
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,
    clearRead,
    store,
  };
}
