<script setup>
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import imageSrc from "@/assets/img/profile.png";
import Dropdown from "./new_form_elements/Dropdown.vue";
import NotificationBell from "./notifications/Notifications.vue";
import ThemeToggle from "./ThemeToggle.vue";

const props = defineProps({
  breadcrumbs: Object,
  showMenuButton: { type: Boolean, default: false },
});
const emit = defineEmits(["open-menu"]);

const authStore = useAuthStore();
const isLoggingOut = ref(false);
const isDev = import.meta.env.DEV;

const user = computed(() => authStore.auth?.user || {});

const fullName = computed(
  () => [user.value.firstName, user.value.fatherName].filter(Boolean).join(" ") || "User"
);
const initials = computed(() =>
  fullName.value
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
);
const roleName = computed(() => user.value.roleName || authStore.auth?.roleName || "");
const companyName = computed(() => user.value.companyName || "Nyala Insurance");

const profilePicture = computed(() => {
  const data = user.value.imageData || user.value.image || null;
  if (!data) return imageSrc;
  if (typeof data === "string" && data.startsWith("data:image/")) return data;
  return `data:image/png;base64,${data}`;
});

// Parent/child route records often share a name ("dashboard" › "Dashboard") — show it once
const crumbs = computed(() =>
  (props.breadcrumbs?.breadcrumbs || []).filter((c) => c.name !== "app").filter(
    (c, i, all) =>
      i === all.length - 1 || String(c.name).toLowerCase() !== String(all[i + 1].name).toLowerCase()
  )
);
const pageTitle = computed(() => crumbs.value.at(-1)?.name || "Health Connect");

function handleImageError(event) {
  event.target.src = imageSrc;
}

async function logout() {
  if (isLoggingOut.value) return;
  isLoggingOut.value = true;
  try {
    await authStore.logout();
  } finally {
    isLoggingOut.value = false;
  }
}
</script>

<template>
  <header
    class="flex sticky top-0 z-[100] gap-2 justify-between items-center px-3 border-b backdrop-blur h-navbar-height border-line bg-surface/90 sm:px-6"
  >
    <!-- Left: menu / back / title -->
    <div class="flex flex-1 gap-1 items-center min-w-0 sm:gap-2">
      <button
        v-if="showMenuButton"
        type="button"
        class="header-icon-btn"
        aria-label="Open navigation"
        @click="emit('open-menu')"
      >
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
        </svg>
      </button>

      <button type="button" class="hidden header-icon-btn sm:grid" aria-label="Go back" @click="$router.back()">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M16 10H4m0 0 5-5m-5 5 5 5" />
        </svg>
      </button>

      <div class="flex flex-col justify-center min-w-0 sm:pl-1">
        <div class="flex gap-2 items-center min-w-0">
          <p class="text-base font-semibold truncate text-ink">{{ pageTitle }}</p>
          <span v-if="isDev" class="badge badge-warning shrink-0">Test</span>
        </div>
        <nav v-if="crumbs.length > 1" aria-label="Breadcrumb" class="hidden min-w-0 md:block">
          <ol class="flex gap-1 items-center text-xs text-ink-subtle">
            <li v-for="(crumb, index) in crumbs" :key="index" class="flex gap-1 items-center min-w-0">
              <svg v-if="index > 0" class="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="m8 5 5 5-5 5" />
              </svg>
              <RouterLink
                v-if="index < crumbs.length - 1 && crumb.path"
                :to="crumb.path"
                class="truncate hover:text-ink hover:underline underline-offset-2"
              >
                {{ crumb.name }}
              </RouterLink>
              <span v-else class="truncate" :aria-current="index === crumbs.length - 1 ? 'page' : undefined">{{ crumb.name }}</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>

    <!-- Right: org, notifications, language, profile -->
    <div class="flex gap-1 items-center shrink-0 sm:gap-2">
      <span class="hidden px-3 py-1 mr-1 text-sm font-medium rounded-md xl:inline-block text-primary bg-primary/5">
        {{ companyName }}
      </span>

      <ThemeToggle class="mx-1" />

      <NotificationBell />

      <Dropdown v-slot="{ setRef, toggleDropdown, open, close }">
        <button
          type="button"
          class="hidden gap-1 items-center px-2.5 h-9 text-sm font-medium rounded-lg sm:flex text-ink-muted hover:bg-surface-muted hover:text-ink"
          aria-haspopup="menu"
          :aria-expanded="open"
          aria-label="Language: English"
          @click.prevent="toggleDropdown"
        >
          EN
          <svg class="w-3.5 h-3.5 transition-transform" :class="{ 'rotate-180': open }" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m5 8 5 5 5-5" />
          </svg>
        </button>
        <div :ref="setRef" class="mt-1.5 w-40 menu-panel" role="menu">
          <button type="button" role="menuitem" class="menu-item" @click="close()">
            English
            <svg class="ml-auto w-4 h-4 text-primary" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 10.5 3 3 7-7" /></svg>
          </button>
        </div>
      </Dropdown>

      <Dropdown v-slot="{ setRef, toggleDropdown, open, close }">
        <button
          type="button"
          class="flex gap-2.5 items-center p-1 rounded-lg sm:pr-2 hover:bg-surface-muted"
          aria-haspopup="menu"
          :aria-expanded="open"
          :aria-label="`Account menu for ${fullName}`"
          @click.prevent="toggleDropdown"
        >
          <span class="overflow-hidden relative w-8 h-8 rounded-full ring-1 shrink-0 ring-line bg-surface-muted">
            <img
              :src="profilePicture"
              :alt="''"
              class="object-cover w-full h-full"
              @error="handleImageError"
            />
          </span>
          <span class="hidden flex-col items-start leading-tight md:flex">
            <span class="max-w-[9rem] text-sm font-medium truncate text-ink">{{ fullName }}</span>
            <span v-if="roleName" class="max-w-[9rem] text-xs truncate text-ink-subtle">{{ roleName }}</span>
          </span>
          <svg class="hidden w-4 h-4 transition-transform md:block text-ink-subtle" :class="{ 'rotate-180': open }" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="m5 8 5 5 5-5" />
          </svg>
        </button>

        <div :ref="setRef" class="mt-1.5 w-64 menu-panel" role="menu">
          <div class="flex gap-3 items-center px-3 py-2.5 mb-1 border-b border-line">
            <span class="grid place-items-center w-9 h-9 text-xs font-semibold rounded-full shrink-0 bg-primary/10 text-primary" aria-hidden="true">
              {{ initials }}
            </span>
            <div class="min-w-0">
              <p class="text-sm font-medium truncate text-ink">{{ fullName }}</p>
              <p class="text-xs truncate text-ink-subtle">{{ user.email || roleName }}</p>
            </div>
          </div>

          <RouterLink to="/profile" role="menuitem" class="menu-item" @click="close()">
            <svg class="w-4 h-4 text-ink-subtle" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="7" r="3.25" /><path d="M3.75 16.5c.9-2.9 3.3-4.5 6.25-4.5s5.35 1.6 6.25 4.5" /></svg>
            My profile
          </RouterLink>
          <RouterLink to="/settings" role="menuitem" class="menu-item" @click="close()">
            <svg class="w-4 h-4 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>
            Settings
          </RouterLink>

          <div class="my-1 border-t border-line" role="separator" />

          <button
            type="button"
            role="menuitem"
            class="menu-item text-error hover:!bg-red-50 hover:!text-red-700"
            :disabled="isLoggingOut"
            @click="logout()"
          >
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 16.5H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h3M13 13.5 16.5 10 13 6.5M16.5 10h-9" /></svg>
            {{ isLoggingOut ? "Signing out…" : "Sign out" }}
          </button>
        </div>
      </Dropdown>
    </div>
  </header>
</template>

<style>
.header-icon-btn {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  color: rgb(var(--ink-muted));
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}
.header-icon-btn:hover {
  background-color: rgb(var(--surface-muted));
  color: rgb(var(--ink));
}
@media (pointer: coarse) {
  .header-icon-btn {
    width: 2.75rem;
    height: 2.75rem;
  }
}

.menu-panel {
  right: 0;
  padding: 0.25rem;
  max-width: calc(100vw - 1.5rem);
  border: 1px solid rgb(var(--line));
  border-radius: 0.75rem;
  background-color: rgb(var(--surface));
  box-shadow: var(--shadow-pop);
  animation: pop-in var(--duration-base) var(--ease-out);
  z-index: 1000 !important;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  min-height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: rgb(var(--ink));
  text-align: left;
  transition: background-color var(--duration-fast) ease;
}
.menu-item:hover {
  background-color: rgb(var(--surface-muted));
}
.menu-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
