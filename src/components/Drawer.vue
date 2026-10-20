<script setup>
import logo from "@/assets/img/logoD.png";
import mark from "@/assets/img/nyala-mark.png";
import SidebarItem from "@/components/layout/SidebarItem.vue";

defineProps({
  navs: { type: Array, default: () => [] },
  collapsed: { type: Boolean, default: false },
  /** Mobile drawer variant shows a close button instead of the collapse toggle */
  mobile: { type: Boolean, default: false },
});

const emit = defineEmits(["toggle-collapse", "navigate", "close"]);
</script>

<template>
  <aside class="flex flex-col h-full border-r bg-surface border-line" aria-label="Main navigation">
    <!-- Brand -->
    <div
      class="flex gap-2 items-center px-4 h-navbar-height shrink-0"
      :class="collapsed ? 'justify-center px-2' : 'justify-between'"
    >
      <RouterLink to="/dashboard" class="flex items-center rounded-md" aria-label="Nyala Insurance — Dashboard" @click="emit('navigate')">
        <img v-if="collapsed" :src="mark" alt="" class="w-8 h-8" width="32" height="32" />
        <img v-else :src="logo" alt="Nyala Insurance" class="w-auto h-9 brand-logo-plate" height="36" />
      </RouterLink>
      <button
        v-if="mobile"
        type="button"
        class="grid place-items-center -mr-1 w-9 h-9 rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink"
        aria-label="Close navigation"
        @click="emit('close')"
      >
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="overflow-y-auto overscroll-contain flex-1 px-3 py-2" :class="{ 'px-2': collapsed }">
      <ul class="flex flex-col gap-0.5">
        <SidebarItem
          v-for="nav in navs"
          :key="nav.path || nav.name"
          :item="nav"
          :collapsed="collapsed"
          @navigate="emit('navigate')"
          @expand-sidebar="emit('toggle-collapse')"
        />
      </ul>
    </nav>

    <!-- Footer -->
    <div class="px-3 py-3 border-t border-line shrink-0" :class="{ 'px-2': collapsed }">
      <button
        v-if="!mobile"
        type="button"
        class="nav-item"
        :class="{ 'justify-center': collapsed }"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="collapsed ? 'Expand sidebar' : undefined"
        @click="emit('toggle-collapse')"
      >
        <span class="nav-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3.5" width="14" height="13" rx="2" />
            <path d="M8 3.5v13" />
            <path v-if="collapsed" d="m11 8.5 1.5 1.5-1.5 1.5" />
            <path v-else d="m13 8.5-1.5 1.5 1.5 1.5" />
          </svg>
        </span>
        <span v-if="!collapsed">Collapse</span>
      </button>
      <p v-if="!collapsed" class="px-3 pt-2 text-xs text-ink-subtle">© {{ new Date().getFullYear() }} Nyala Insurance</p>
    </div>
  </aside>
</template>
