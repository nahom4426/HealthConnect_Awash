<script setup>
import { ref } from "vue";
import NestedDrawerButton from "./NestedDrawerButton.vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  navs: { type: Object, required: true },
  collapsed: { type: Boolean, default: false },
});

const open = ref(false);
</script>

<template>
  <!-- ── Leaf nav item (no children) ── -->
  <div v-if="navs?.path && !navs?.navs" class="nav-item-wrap">
    <RouterLink :to="navs.path" custom v-slot="{ isActive, navigate }">
      <button
        @click="navigate"
        class="nav-item"
        :class="isActive ? 'nav-item-active' : 'nav-item-default'"
        :title="collapsed ? navs.name : undefined"
      >
        <span class="nav-icon" :class="isActive ? 'text-white' : 'text-white/50'" v-html="navs.icon" />
        <span v-if="!collapsed" class="nav-label" :class="isActive ? 'text-white font-semibold' : 'text-white/65'">
          {{ navs.name }}
        </span>
        <span v-if="isActive && !collapsed" class="ml-auto w-1.5 h-1.5 rounded-full bg-white/80 flex-shrink-0"></span>
      </button>
    </RouterLink>
  </div>

  <!-- ── Group item (has children) ── -->
  <div v-else-if="navs?.navs" class="nav-group-wrap">
    <!-- Group header -->
    <button
      @click="open = !open"
      class="nav-item nav-item-default w-full"
      :title="collapsed ? navs.name : undefined"
    >
      <span class="nav-icon text-white/50" v-html="navs.icon" />
      <span v-if="!collapsed" class="nav-label text-white/65">{{ navs.name }}</span>
      <span v-if="!collapsed" class="ml-auto flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-3 h-3 text-white/30 transition-transform duration-200"
          :class="open ? 'rotate-180' : 'rotate-0'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </span>
    </button>

    <!-- Children -->
    <Transition name="nav-expand">
      <div v-if="open && !collapsed" class="nav-children">
        <NestedDrawerButton :navs="navs.navs" :collapsed="false" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.nav-item-wrap,
.nav-group-wrap {
  margin-bottom: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  background: transparent;
  min-height: 2.5rem;
  position: relative;
}

.nav-item-default:hover {
  background: rgba(255,255,255,0.06);
}
.nav-item-default:hover .nav-icon {
  color: rgba(255,255,255,0.8);
}
.nav-item-default:hover .nav-label {
  color: rgba(255,255,255,0.85);
}

.nav-item-active {
  background: linear-gradient(135deg, rgba(30,64,175,0.35) 0%, rgba(14,165,233,0.18) 100%);
  box-shadow: inset 0 0 0 1px rgba(59,130,246,0.3), 0 2px 10px rgba(0,0,0,0.25);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  transition: color 0.15s;
}

.nav-label {
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  transition: color 0.15s;
}

/* Children indent */
.nav-children {
  padding-left: 0.875rem;
  margin-top: 1px;
  border-left: 1px solid rgba(255,255,255,0.06);
  margin-left: 1.375rem;
}

/* Expand animation */
.nav-expand-enter-active,
.nav-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.nav-expand-enter-from,
.nav-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.nav-expand-enter-to,
.nav-expand-leave-from {
  opacity: 1;
  max-height: 600px;
}
</style>
