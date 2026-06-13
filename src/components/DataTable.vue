<script setup lang="ts">
import { inject } from "vue";

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
  hideIndex: {
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
    <div class="hidden lg:block overflow-x-auto rounded-lg border border-gray-200/80 bg-white">
      <div class="inline-block min-w-full align-middle">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/60">
              <!-- First column slot -->
              <th v-if="firstCol" class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <slot name="headerFirst"></slot>
              </th>

              <!-- Index column -->
              <th v-if="!hideIndex" class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-12">
                #
              </th>

              <!-- Dynamic headers -->
              <th
                v-for="(header, index) in headers"
                :key="index"
                class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                {{ header }}
              </th>

              <!-- Last column slot -->
              <th v-if="lastCol" class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <slot name="headerLast"></slot>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <slot />
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Card View -->
    <div class="space-y-2 lg:hidden">
      <slot name="mobile" />
    </div>
  </div>
</template>

<style scoped>
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 5px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>