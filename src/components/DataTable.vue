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
  <div :class="$attrs.class">
    <!-- Desktop Table View -->
    <div class="hidden overflow-visible lg:block">
      <table class="min-w-full bg-white rounded-xl border border-gray-200 shadow-sm">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            <th v-if="firstCol" class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
              <slot name="headerFirst"></slot>
            </th>

            <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">#</th>
            <th v-for="(header, index) in headers" :key="index" class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
              {{ header }}
            </th>
            <th v-if="lastCol" class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
              <slot name="headerLast"></slot>
            </th>
          </tr>
        </thead>
        <slot name="body">
          <tbody class="overflow-visible divide-y divide-gray-200">
            <slot />
          </tbody>
        </slot>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="lg:hidden">
      <slot name="mobile" />
    </div>
  </div>
</template>
