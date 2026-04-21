<script setup lang="ts">
import { computed } from 'vue';
import type { Notification } from '@/stores/notificationStore';

const props = defineProps<{
  notification: Notification;
}>();

const emit = defineEmits(['remove', 'mark-as-read']);

const typeColors = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-800',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
  },
};

const colors = computed(() => typeColors[props.notification.type]);

const timeAgo = computed(() => {
  const now = new Date();
  const diff = now.getTime() - new Date(props.notification.timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(props.notification.timestamp).toLocaleDateString();
});

function handleRemove() {
  emit('remove', props.notification.id);
}

function handleMarkAsRead() {
  if (!props.notification.read) {
    emit('mark-as-read', props.notification.id);
  }
}

function handleAction() {
  if (props.notification.action) {
    props.notification.action.callback();
  }
}
</script>

<template>
  <div
    :class="[
      'px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group',
      !notification.read && 'bg-blue-50/50',
    ]"
    @click="handleMarkAsRead"
  >
    <!-- Unread indicator -->
    <div v-if="!notification.read" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

    <div class="flex gap-3 pl-2">
      <!-- Icon -->
      <div :class="['flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center', colors.bg, colors.border, 'border']">
        <span :class="['text-lg', colors.icon]">{{ notification.icon }}</span>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <h4 class="font-semibold text-gray-900 text-sm">{{ notification.title }}</h4>
            <p class="text-gray-600 text-xs mt-0.5 line-clamp-2">{{ notification.message }}</p>
          </div>

          <!-- Close button -->
          <button
            @click.stop="handleRemove"
            class="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove notification"
          >
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Time and Action -->
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-gray-500">{{ timeAgo }}</span>
          <button
            v-if="notification.action"
            @click.stop="handleAction"
            class="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {{ notification.action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}
</style>
