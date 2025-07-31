<script setup lang="ts">
import { inject, watch } from "vue";

const props = defineProps({
  headers: {
    type: Array,
    required: true,
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
  firstCol: {
    type: Boolean,
    default: false,
  },
  lastCol: {
    type: Boolean,
    default: false,
  },
});

const next = inject("next", () => {});
const previous = inject("previous", () => {});

const page = inject("page", 1);
const totalPages = inject("totalPages", 1);
</script>
<template>
  <table class="min-w-full border rounded-lg">
    <thead class="bg-accent rounded capitalize">
      <tr class="text-base-clr">
        <th v-if="firstCol" class="th p-2 text-left uppercase tracking-wider">
          <slot name="headerFirst"></slot>
        </th>

        <th class="th p-3 px-4 text-left uppercase tracking-wider">#</th>
        <!-- Add row number column -->
        <th v-for="header in headers" :key="header" class="p-2 text-left">
          {{ header }}
        </th>
        <th v-if="lastCol" class="th p-3 text-left uppercase tracking-wider">
          <slot name="headerLast"></slot>
        </th>
      </tr>
    </thead>
    <slot />
  </table>
</template>
