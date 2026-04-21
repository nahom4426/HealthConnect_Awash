<script setup lang="ts">
import { ref, computed } from 'vue';
import NotificationPanel from './NotificationPanel.vue';
import icons from '@/utils/icons';
import { useNotificationStore } from '@/stores/notificationStore';

const showPanel = ref(false);

// ✅ Call store after Pinia is installed
const notificationStore = useNotificationStore();

const unreadCount = computed(() => notificationStore.unreadCount);
const hasUnread = computed(() => unreadCount.value > 0);

function togglePanel() {
  showPanel.value = !showPanel.value;
  if (showPanel.value) {
    notificationStore.markAllAsRead();
  }
}

function closePanel() {
  showPanel.value = false;
}
</script>


<template>
  <div class="relative">
    <!-- Bell Icon Button -->
    <button
      @click="togglePanel"
      class="relative p-2.5 rounded-xl transition-all duration-300 hover:bg-primary/10 group hover:scale-105 hover:shadow-md hover:shadow-primary/20"
      aria-label="Notifications"
    >
      <!-- Bell Icon -->
      <svg
        class="w-6 h-6 text-gray-700 transition-all duration-300 group-hover:text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- Unread Badge -->
      <span
        v-if="hasUnread"
        class="flex absolute top-1 right-1 justify-center items-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Notification Panel -->
    <NotificationPanel
      v-if="showPanel"
      @close="closePanel"
    />
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
