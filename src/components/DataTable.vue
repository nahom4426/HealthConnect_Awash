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
    <div class="hidden overflow-x-auto rounded-xl border border-gray-200 shadow-sm lg:block">
      <div class="inline-block min-w-full align-middle">
        <div class="overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <!-- First column slot -->
                <th v-if="firstCol" class="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase whitespace-nowrap">
                  <slot name="headerFirst"></slot>
                </th>

                <!-- Index column -->
                <th v-if="!hideIndex" class="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase whitespace-nowrap">
                  #
                </th>

                <!-- Dynamic headers - THIS IS THE ONLY PLACE HEADERS COME FROM -->
                <th 
                  v-for="(header, index) in headers" 
                  :key="index" 
                  class="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase whitespace-nowrap"
                >
                  {{ header }}
                </th>

                <!-- Last column slot -->
                <th v-if="lastCol" class="px-4 py-3.5 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase whitespace-nowrap">
                  <slot name="headerLast"></slot>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <slot />
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Mobile Card View -->
    <div class="space-y-3 lg:hidden">
      <slot name="mobile" />
    </div>
  </div>
</template>

<style scoped>
/* Smooth table container */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>