<script setup>
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

const props = defineProps({
  item: { type: Object, required: true },
  collapsed: { type: Boolean, default: false },
  depth: { type: Number, default: 0 },
});

const emit = defineEmits(["navigate", "expand-sidebar"]);

const route = useRoute();

const matches = (path) => !!path && (route.path === path || route.path.startsWith(`${path}/`));

const children = computed(() => (Array.isArray(props.item.navs) ? props.item.navs : []));
const isGroup = computed(() => children.value.length > 0);
const isActive = computed(() =>
  isGroup.value ? children.value.some((c) => matches(c.path)) : matches(props.item.path)
);

const open = ref(isActive.value);
// Open the group that contains the current page when navigating to it
watch(isActive, (active) => {
  if (active) open.value = true;
});

function toggleGroup() {
  if (props.collapsed) {
    open.value = true;
    emit("expand-sidebar");
    return;
  }
  open.value = !open.value;
}

const panelId = `nav-group-${Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <li v-privilage="item.meta?.permissions">
    <!-- Group -->
    <template v-if="isGroup">
      <button
        type="button"
        class="nav-item"
        :class="{ 'nav-item--group-active': isActive, 'justify-center': collapsed }"
        :aria-expanded="collapsed ? undefined : open"
        :aria-controls="collapsed ? undefined : panelId"
        :title="collapsed ? item.name : undefined"
        @click="toggleGroup"
      >
        <span class="nav-icon" aria-hidden="true" v-html="item.icon" />
        <template v-if="!collapsed">
          <span class="flex-1 text-left truncate">{{ item.name }}</span>
          <svg
            class="w-4 h-4 transition-transform duration-200 shrink-0 text-ink-subtle"
            :class="{ 'rotate-90': open }"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m8 5 5 5-5 5" />
          </svg>
        </template>
        <span v-else class="sr-only">{{ item.name }}</span>
      </button>

      <div v-if="!collapsed" class="nav-collapse" :class="{ 'nav-collapse--open': open }">
        <div class="overflow-hidden min-h-0" :inert="!open || undefined">
          <ul :id="panelId" class="flex flex-col gap-0.5 py-1 pl-3 ml-[1.375rem] border-l border-line">
            <SidebarItem
              v-for="child in children"
              :key="child.path || child.name"
              :item="child"
              :depth="depth + 1"
              @navigate="emit('navigate')"
            />
          </ul>
        </div>
      </div>
    </template>

    <!-- Link -->
    <RouterLink
      v-else-if="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ 'nav-item--active': isActive, 'justify-center': collapsed, 'nav-item--child': depth > 0 }"
      :aria-current="isActive ? 'page' : undefined"
      :title="collapsed ? item.name : undefined"
      @click="emit('navigate')"
    >
      <span v-if="depth === 0" class="nav-icon" aria-hidden="true" v-html="item.icon" />
      <span v-if="!collapsed" class="truncate">{{ item.name }}</span>
      <span v-else class="sr-only">{{ item.name }}</span>
    </RouterLink>
  </li>
</template>

<style>
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.375rem;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(var(--ink-muted));
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.nav-item:hover {
  background-color: rgb(var(--ink) / 0.045);
  color: rgb(var(--ink));
}
.nav-item:focus-visible {
  outline: 2px solid rgb(var(--primary) / 0.7);
  outline-offset: -2px;
}
.nav-item--child {
  min-height: 2.125rem;
  font-weight: 450;
}
.nav-item--active,
.nav-item--active:hover {
  background-color: rgb(var(--primary) / 0.08);
  color: rgb(var(--primary));
  font-weight: 600;
}
.nav-item--group-active {
  color: rgb(var(--ink));
}
.nav-item--group-active .nav-icon {
  color: rgb(var(--primary));
}

.nav-icon {
  display: grid;
  place-items: center;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}
.nav-icon svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* Animated expand/collapse without measuring heights */
.nav-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-base) var(--ease-out);
}
.nav-collapse--open {
  grid-template-rows: 1fr;
}
</style>
