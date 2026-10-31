<template>
  <div class="relative inline-block text-left" ref="dropdownRef">
    <!-- Bell Button Trigger -->
    <button
      @click="toggleDropdown"
      class="relative p-2 rounded-xl text-ink-muted hover:text-blue-900 hover:bg-surface-raised transition cursor-pointer outline-none"
      title="Notifications & System Alerts"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <!-- Unread Badge Dot -->
      <span
        v-if="notifStore.unreadCount > 0"
        class="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse"
      >
        {{ notifStore.unreadCount }}
      </span>
    </button>

    <!-- Dropdown Modal -->
    <Transition name="fade-slide">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-line z-[9999] overflow-hidden"
      >
        <!-- Header -->
        <div class="px-4 py-3 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="text-xs font-black uppercase tracking-wider">Live System Alerts</span>
            <span v-if="notifStore.unreadCount > 0" class="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded-full border border-amber-400/30">
              {{ notifStore.unreadCount }} unread
            </span>
          </div>

          <button
            v-if="notifStore.unreadCount > 0"
            @click="notifStore.markAllAsRead"
            class="text-[10px] font-bold text-slate-300 hover:text-white underline cursor-pointer"
          >
            Mark all read
          </button>
        </div>

        <!-- Notification Feed Items -->
        <div class="max-h-80 overflow-y-auto divide-y divide-line">
          <div
            v-for="item in notifStore.notifications"
            :key="item.id"
            @click="handleNotificationClick(item)"
            :class="[
              'p-3.5 transition cursor-pointer flex items-start gap-3 hover:bg-surface-muted',
              !item.isRead ? 'bg-blue-50/40 border-l-4 border-blue-600' : 'bg-white opacity-85'
            ]"
          >
            <!-- Type Icon -->
            <div :class="typeBadgeClass(item.type)" class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm">
              <svg v-if="item.type === 'proposal'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <svg v-else-if="item.type === 'payment'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <svg v-else-if="item.type === 'inspection'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1">
                <h4 class="text-xs font-extrabold text-ink truncate">{{ item.title }}</h4>
                <span class="text-[10px] text-ink-subtle font-mono whitespace-nowrap">{{ item.timestamp }}</span>
              </div>
              <p class="text-[11px] text-ink-muted leading-tight mt-0.5 line-clamp-2">{{ item.message }}</p>

              <div class="flex items-center gap-2 mt-1.5">
                <span v-if="item.badge" class="px-2 py-0.5 bg-surface-raised text-ink-muted font-bold text-[9px] rounded-md border border-line uppercase">
                  {{ item.badge }}
                </span>
                <span v-if="!item.isRead" class="w-2 h-2 rounded-full bg-blue-600"></span>
              </div>
            </div>
          </div>

          <div v-if="notifStore.notifications.length === 0" class="p-6 text-center text-xs text-ink-subtle italic">
            No system notifications available.
          </div>
        </div>

        <!-- Footer -->
        <div class="p-2.5 bg-surface-muted border-t border-line text-center">
          <button @click="isOpen = false" class="text-xs font-bold text-ink-muted hover:text-ink transition">
            Close Panel
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '@/stores/notificationStore';

const notifStore = useNotificationStore();
const router = useRouter();
const isOpen = ref(false);
const dropdownRef = ref(null);

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function handleNotificationClick(item) {
  notifStore.markAsRead(item.id);
  isOpen.value = false;
  if (item.link) {
    router.push(item.link);
  }
}

function typeBadgeClass(type) {
  switch (type) {
    case 'proposal': return 'bg-blue-900';
    case 'payment': return 'bg-emerald-600';
    case 'inspection': return 'bg-purple-600';
    case 'claim': return 'bg-amber-600';
    default: return 'bg-slate-700';
  }
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

// No push channel yet, so poll; skip while the tab is hidden
const POLL_MS = 60000;
let pollTimer = null;

function refreshIfVisible() {
  if (document.visibilityState === 'visible') notifStore.fetchNotifications();
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('visibilitychange', refreshIfVisible);
  notifStore.fetchNotifications();
  pollTimer = setInterval(refreshIfVisible, POLL_MS);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('visibilitychange', refreshIfVisible);
  clearInterval(pollTimer);
});
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease-out;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
