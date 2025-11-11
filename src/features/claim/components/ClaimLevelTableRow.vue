<script setup>
import { ref } from "vue";
import { formatCurrency } from "@/utils/utils";
import icons from "@/utils/icons";
import { openModal } from "@customizer/modal-x";

const props = defineProps({
  rowData: Array,
  rowKeys: Array,
  headKeys: Array,
  onEdit: Function,
  onDelete: Function,
});

const emit = defineEmits(["edit", "delete"]);

function getLevelBadgeColor(level) {
  const colors = {
    LEVEL1: "bg-blue-100 text-blue-700 border-blue-200",
    LEVEL2: "bg-green-100 text-green-700 border-green-200",
    LEVEL3: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LEVEL4: "bg-orange-100 text-orange-700 border-orange-200",
    LEVEL5: "bg-red-100 text-red-700 border-red-200",
  };
  return colors[level] || "bg-gray-100 text-gray-700 border-gray-200";
}

function formatLevel(level) {
  return level.replace("LEVEL", "LEVEL ");
}

function handleEdit(row) {
  openModal("EditClaimLevel", { data: { ...row } });
}

function handleDelete(row) {
  if (props.onDelete) {
    props.onDelete(row);
  } else {
    emit("delete", row);
  }
}
</script>

<template>
  <tr
    v-for="(row, idx) in rowData"
    :key="row.claimLevelUuid"
    class="bg-white border-b transition-all duration-200 ease-in-out hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-sm"
  >
    <!-- Index -->
    <td class="p-4 font-medium text-gray-500">
      {{ idx + 1 }}
    </td>
    <!-- Claim Level -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span
          :class="getLevelBadgeColor(row.claimLevel)"
          class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold border-2 shadow-sm"
        >
          {{ formatLevel(row.claimLevel) }}
        </span>
      </div>
    </td>

    <!-- Minimum Amount -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Minimum</p>
          <p class="text-base font-bold text-gray-900">
            ETB {{ formatCurrency(row.minAmount) }}
          </p>
        </div>
      </div>
    </td>

    <!-- Maximum Amount -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Maximum</p>
          <p class="text-base font-bold text-gray-900">
            ETB {{ formatCurrency(row.maxAmount) }}
          </p>
        </div>
      </div>
    </td>

    <!-- Range Display -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Range</p>
          <p class="text-base font-bold text-orange-600">
            ETB {{ formatCurrency(row.maxAmount - row.minAmount) }}
          </p>
        </div>
      </div>
    </td>

    <!-- Actions -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-2 justify-start">
        <button
          @click.stop="handleEdit(row)"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-150 group"
          type="button"
        >
          <i v-html="icons.edit" class="w-4 h-4"></i>
          <span class="font-medium text-sm">Edit</span>
        </button>
        <button
          @click.stop="handleDelete(row)"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-150 group"
          type="button"
        >
          <i v-html="icons.delete" class="w-4 h-4"></i>
          <span class="font-medium text-sm">Delete</span>
        </button>
      </div>
    </td>
  </tr>
</template>

