<script setup>
import { containerMaxW } from '@/config.js';
import BaseLevel from '@/components/base/BaseLevel.vue';
// import JustboilLogo from '@/components/JustboilLogo.vue'

const year = new Date().getFullYear();
</script>

<template>
  <footer class="py-2">
    <BaseLevel>
      <div class="w-full text-left">
        <b>&copy;{{ year }}, HealthConnect</b>
        <slot />
      </div>
      <div class="md:py-2"></div>
    </BaseLevel>
  </footer>
</template>
