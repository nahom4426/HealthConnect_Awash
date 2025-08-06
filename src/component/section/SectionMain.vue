<script setup>
import { containerMaxW } from '@/config.js';
</script>

<template>
  <section class="max-w-full w-full min-h-[88vh]" :class="containerMaxW">
    <slot />
  </section>
</template>
