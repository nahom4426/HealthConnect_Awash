<script setup>
import { computed, ref } from "vue";
import NestedDrawerButton from "./NestedDrawerButton.vue";
import icons from "@/utils/icons";
import { RouterLink } from "vue-router";
import { useRoute } from "vue-router";

const props = defineProps({
  navs: {
    type: Object,
    required: true,
  },
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

const open = ref(false);
const route = useRoute();

const isGroupActive = computed(() => {
  if (!Array.isArray(props.navs?.navs)) return false;
  return props.navs.navs.some((child) => child?.path === route.path);
});
</script>

<template>
  <div>
    <!-- Single nav item (leaf) -->
    <div
      v-privilage="navs.meta?.permissions"
      v-if="navs?.path && !navs?.navs"
    >
      <RouterLink
        :to="navs.path"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group"
        :class="[
          route.path === navs.path
            ? 'text-primary bg-primary/10 font-semibold'
            : 'text-gray-500 hover:text-primary hover:bg-primary/5'
        ]"
      >
        <!-- Left accent bar on active -->
        <span
          class="flex-shrink-0 w-[3px] h-4 rounded-full transition-all duration-150 -ml-0.5"
          :class="route.path === navs.path ? 'bg-primary' : 'bg-transparent'"
        ></span>
        <!-- Icon -->
        <span
          class="flex-shrink-0 flex items-center justify-center text-[16px] transition-colors duration-150"
          :class="route.path === navs.path ? 'text-primary' : 'text-gray-400 group-hover:text-primary'"
        >
          <i v-html="navs.icon" />
        </span>
        <span v-if="!isCollapsed" class="truncate">{{ navs.name }}</span>
      </RouterLink>
    </div>

    <!-- Parent nav group (with children) -->
    <div
      v-privilage="navs.meta?.permissions"
      v-else-if="navs?.navs"
    >
      <button
        @click="open = !open"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group"
        :class="[
          isGroupActive || open
            ? 'text-primary'
            : 'text-gray-500 hover:text-primary hover:bg-primary/5'
        ]"
      >
        <!-- Left accent bar on active group -->
        <span
          class="flex-shrink-0 w-[3px] h-4 rounded-full transition-all duration-150 -ml-0.5"
          :class="isGroupActive ? 'bg-primary' : 'bg-transparent'"
        ></span>
        <!-- Icon -->
        <span
          class="flex-shrink-0 flex items-center justify-center text-[16px] transition-colors duration-150"
          :class="isGroupActive || open ? 'text-primary' : 'text-gray-400 group-hover:text-primary'"
        >
          <i v-html="navs?.icon" />
        </span>
        <span v-if="!isCollapsed" class="truncate">{{ navs?.name }}</span>
        <svg
          v-if="!isCollapsed"
          class="ml-auto w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
          :class="[open ? 'rotate-180 text-primary' : 'text-gray-300']"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Children -->
      <Transition name="expand">
        <div
          v-if="open && navs?.navs"
          class="mt-0.5 ml-7 pl-3 border-l-2 border-primary/10 space-y-0.5"
        >
          <NestedDrawerButton :navs="navs?.navs" :is-collapsed="isCollapsed" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}
</style>
