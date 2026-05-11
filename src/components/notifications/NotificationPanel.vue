<script setup lang="ts">
import { computed } from 'vue';
import { useNotificationStore } from '@/stores/notificationStore';
import NotificationItem from './NotificationItem.vue';

const notificationStore = useNotificationStore();

const emit = defineEmits(['close']);

const notifications = computed(() => notificationStore.sortedNotifications);
const hasNotifications = computed(() => notifications.value.length > 0);
const unreadCount = computed(() => notificationStore.unreadCount);

function handleClearAll() {
  notificationStore.clearAll();
}

function handleClearRead() {
  notificationStore.clearRead();
}

function handleRemove(id: string) {
  notificationStore.removeNotification(id);
}

function handleMarkAsRead(id: string) {
  notificationStore.markAsRead(id);
}
</script>

<template>
  <div class="fixed inset-0 z-40" @click="emit('close')"></div>

  <div
    class="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slide-down"
  >
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-gray-900">Notifications</h3>
          <p v-if="unreadCount > 0" class="text-xs text-gray-600 mt-1">
            {{ unreadCount }} unread
          </p>
        </div>
        <button
          @click="emit('close')"
          class="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Notifications List -->
    <div v-if="hasNotifications" class="max-h-96 overflow-y-auto">
      <NotificationItem
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @remove="handleRemove"
        @mark-as-read="handleMarkAsRead"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="px-6 py-12 text-center">
      <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <p class="text-gray-600 font-medium">No notifications yet</p>
      <p class="text-sm text-gray-500 mt-1">You're all caught up!</p>
    </div>

    <!-- Footer Actions -->
    <div v-if="hasNotifications" class="bg-gray-50 px-6 py-3 border-t border-gray-200 flex gap-2">
      <button
        @click="handleClearRead"
        class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
      >
        Clear Read
      </button>
      <button
        @click="handleClearAll"
        class="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        Clear All
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slideDown 0.3s ease-out;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
