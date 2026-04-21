<script setup>
import { useSocket } from '@/composables/useSocket';
import { useNotifications } from '@/store/notifications.js';
import { secondDateFormat } from '@/utils/utils';
import { computed } from 'vue';
import Dropdown from '../new_form_elements/Dropdown.vue';

const notifications = useNotifications();
const socket = useSocket();

const unreadCount = computed(() =>
  Array.isArray(notifications.notifications)
    ? notifications.notifications.filter((n) => !n?.seen).length
    : 0
);

function markAllAsRead() {
  const unreadIds = (Array.isArray(notifications.notifications) ? notifications.notifications : [])
    .filter((n) => !n?.seen)
    .map((n) => n.notificationUuid);
  
  if (unreadIds.length > 0) {
    socket.send('/app/seen', JSON.stringify(unreadIds));
    unreadIds.forEach(id => notifications.seen(id));
  }
}

function markAsRead(id) {
  socket.send('/app/seen', JSON.stringify([id]));
  notifications.seen(id);
}
</script>

<template>
  <Dropdown v-slot="{ setRef, toggleDropdown, open }">
    <button
      @click.prevent="toggleDropdown"
      class="relative p-2.5 rounded-xl transition-all duration-300 hover:bg-primary/10 group hover:scale-105 hover:shadow-md hover:shadow-primary/20"
      aria-label="Notifications"
      aria-haspopup="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="w-5 h-5 text-gray-600 transition-colors duration-300 group-hover:text-primary"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      :ref="setRef"
      class="absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border shadow-xl backdrop-blur-md border-primary/20 bg-white/95 overflow-hidden"
      :class="open ? 'block' : 'hidden'"
      style="z-index: 10002;"
    >
      <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-bold text-base text-gray-800">Notifications</h3>
          <button
            v-if="unreadCount > 0"
            @click.prevent="markAllAsRead"
            class="text-xs font-semibold text-primary hover:underline"
          >
            Mark all read
          </button>
        </div>
      </div>

      <div class="max-h-[420px] overflow-auto">
        <div
          v-if="!notifications.notifications?.length"
          class="p-6 text-center"
        >
          <div class="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p class="text-sm text-gray-500">No notifications</p>
        </div>

        <div
          v-for="notification in notifications.notifications"
          :key="notification.notificationUuid"
          class="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
          :class="{ 'bg-blue-50/30': !notification?.seen }"
        >
          <p class="text-sm text-gray-800 leading-relaxed mb-2">
            {{ notification?.message }}
          </p>

          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-gray-500">
              {{ secondDateFormat(notification?.statusUpdateDate) }}
            </p>

            <button
              v-if="!notification?.seen"
              @click.prevent="markAsRead(notification.notificationUuid)"
              class="text-xs font-semibold text-primary hover:underline"
            >
              Mark read
            </button>
          </div>
        </div>
      </div>
    </div>
  </Dropdown>
</template>
