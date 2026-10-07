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
      type="button"
      class="relative header-icon-btn"
      :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'"
      aria-haspopup="true"
      :aria-expanded="open"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="w-5 h-5" aria-hidden="true"
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
        class="flex absolute top-1 right-1 justify-center items-center px-1 h-4 text-[10px] font-semibold text-white rounded-full ring-2 min-w-[16px] bg-error ring-surface" aria-hidden="true"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      :ref="setRef"
      class="overflow-hidden !p-0 mt-1.5 w-[360px] menu-panel"
      :class="open ? 'block' : 'hidden'"
    >
      <div class="px-4 py-3 border-b border-line">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-ink">Notifications</h3>
          <button
            v-if="unreadCount > 0"
            @click.prevent="markAllAsRead"
            type="button"
            class="text-xs font-medium text-primary hover:underline"
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
          <div class="flex justify-center items-center mx-auto mb-3 w-10 h-10 rounded-full bg-surface-muted">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5 text-ink-subtle" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p class="text-sm text-ink-muted">You're all caught up</p>
        </div>

        <div
          v-for="notification in notifications.notifications"
          :key="notification.notificationUuid"
          class="px-4 py-3 border-b transition-colors last:border-0 border-line hover:bg-surface-muted"
          :class="{ 'bg-primary/[0.03]': !notification?.seen }"
        >
          <p class="mb-1.5 text-sm leading-relaxed text-ink">
            {{ notification?.message }}
          </p>

          <div class="flex items-center justify-between gap-3">
            <p class="text-xs text-ink-subtle">
              {{ secondDateFormat(notification?.statusUpdateDate) }}
            </p>

            <button
              v-if="!notification?.seen"
              type="button"
              @click.prevent="markAsRead(notification.notificationUuid)"
              class="text-xs font-medium text-primary hover:underline"
            >
              Mark read
            </button>
          </div>
        </div>
      </div>
    </div>
  </Dropdown>
</template>
