<script setup>
import { useRoleContext } from '@/features/motor/composables/useRoleContext';

// Only rendered in dev / demo builds; see utils/actingRole.js
const { activeRole, setRole, ROLES, roleSwitcherEnabled } = useRoleContext();

// Reload so every role-derived computed (including ones that read the logged-in
// role once) picks up the newly selected demo role.
function onChange(event) {
  setRole(event.target.value);
  window.location.reload();
}
</script>

<template>
  <div v-if="roleSwitcherEnabled" class="role-switcher" title="Demo: act as a different role">
    <svg class="role-switcher__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
    <span class="role-switcher__label">Acting as</span>
    <select class="role-switcher__select" :value="activeRole" @change="onChange">
      <option v-for="r in ROLES" :key="r.code" :value="r.code">{{ r.name }}</option>
    </select>
  </div>
</template>

<style scoped>
.role-switcher {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.6rem;
  background: rgb(var(--surface));
  border: 1px dashed var(--primary, #03396c);
  border-radius: 10px;
  font-size: 0.78rem;
}
.role-switcher__icon { width: 1rem; height: 1rem; color: var(--primary, var(--shade-03396c, #03396c)); }
.role-switcher__label { font-weight: 700; color: var(--primary, var(--shade-03396c, #03396c)); white-space: nowrap; }
.role-switcher__select {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgb(var(--ink));
  cursor: pointer;
  outline: none;
  max-width: 190px;
}
</style>
