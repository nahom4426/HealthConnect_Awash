<script setup lang="ts">
import icons from "@/utils/icons";
import type { PropType, Ref } from "vue";

const props = defineProps({
  watch: {
    type: Array as PropType<Ref[]>,
    default: [],
  },
});
</script>
<template>
  <div class="flex-1 flex gap-3 justify-end items-center">
    <div
      :class="[watch.some(el => !!el) ? 'shadow-primary shadow-md bg-primary/30' : 'bg-black/10 shadow-md']"
      class="transition-all duration-75 bar bar-right size-9 rounded grid place-items-center"
    >
      <i v-html="icons.filter" />
    </div>
    <slot />
  </div>
</template>
