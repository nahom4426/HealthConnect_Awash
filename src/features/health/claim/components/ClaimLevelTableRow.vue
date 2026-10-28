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
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

const emit = defineEmits(["edit", "delete"]);

function getLevelBadgeColor(level) {
  const colors = {
    LEVEL1: "bg-primary/10 text-primary-hover border-primary/20",
    LEVEL2: "bg-success-soft text-success-strong border-success/20",
    LEVEL3: "bg-warning-soft text-warning-strong border-warning/20",
    LEVEL4: "bg-orange-100 text-orange-700 border-orange-200",
    LEVEL5: "bg-error-soft text-error-strong border-error/20",
  };
  return colors[level] || "bg-surface-muted text-ink-muted border-line";
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
    class="bg-white border-b transition-all duration-200 ease-in-out hover:bg-gradient-to-r hover:from-surface-muted hover:to-white hover:shadow-sm"
  >
    <!-- Index -->
    <td class="px-4 py-3 text-sm font-medium text-ink-subtle">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>
    <!-- Claim Level -->
    <td class="p-4 py-5">
      <div class="flex items-center gap-3">
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary shadow-md">
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
        <div class="flex justify-center items-center w-10 h-10 rounded-lg bg-gradient-to-br from-success to-success shadow-md">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
        <div>
          <p class="text-xs text-ink-subtle font-medium">Minimum</p>
          <p class="text-base font-bold text-ink">
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
          <p class="text-xs text-ink-subtle font-medium">Maximum</p>
          <p class="text-base font-bold text-ink">
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
          <p class="text-xs text-ink-subtle font-medium">Range</p>
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
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 text-primary-hover hover:bg-primary/10 transition-colors duration-150 group"
          type="button"
        >
          <i v-html="icons.edit" class="w-4 h-4"></i>
          <span class="font-medium text-sm">Edit</span>
        </button>
        <button
          @click.stop="handleDelete(row)"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-error-soft text-error-strong hover:bg-error-soft transition-colors duration-150 group"
          type="button"
        >
          <i v-html="icons.delete" class="w-4 h-4"></i>
          <span class="font-medium text-sm">Delete</span>
        </button>
      </div>
    </td>
  </tr>
</template>

