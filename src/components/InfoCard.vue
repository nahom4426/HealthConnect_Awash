<script setup lang="ts">
import type { PropType } from "vue";

interface InfoCard {
  label: string;
  value: string;
}

const props = defineProps({
  title: String,
  info: {
    type: Array as PropType<{ label: string; value: string }[]>,
    default: [],
  },
});
</script>
<template>
  <div class="flex flex-col gap-3 bg-gray-100 p-3 px-2 rounded-md">
    <div class="text-lg border-b pb-2">
      <slot name="title">
        {{ props?.title }}
      </slot>
    </div>
    <div :key="data.label" v-for="data in info" class="leading-none">
      <p class="leading-none text-base">
				<slot :name="data.label.replace(/\s/g, '')" :value="data.value" >
					{{ data.value }}
				</slot>
      </p>
      <span class="text-primary italic text-xs leading-none">{{
        data.label
      }}</span>
    </div>
  </div>
</template>
