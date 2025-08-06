<script setup>
import { computed } from 'vue';
import UserAvatar from '@/components/user/UserAvatar.vue';

const userAvatar = computed(() => `https://api.dicebear.com/7.x/avataaars/svg`);

// const mainStore = useMainStore()
</script>

<template>
  <UserAvatar username="userName" avatar="userAvatar">
    <slot />
  </UserAvatar>
</template>
