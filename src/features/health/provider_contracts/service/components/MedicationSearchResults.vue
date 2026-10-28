<script setup>
import { ref } from "vue";

const props = defineProps({
  search: String,
});

function handleAdd(medication) {
  console.log("Adding medication:", medication);
}

const medications = ref([
  { id: 1, name: "Medication 1" },
  { id: 2, name: "Medication 2" },
]);
</script>

<template>
  <div class="flex flex-col gap-2 bg-base-clr2 p-4 rounded">
    <div
      v-for="medication in medications"
      :key="medication.id"
      class="flex justify-between items-center p-4 bg-white"
    >
      <span>{{ medication.name }}</span>
      <button
        @click="handleAdd(medication)"
        class="bg-primary text-white px-4 py-1 rounded"
      >
        Add
      </button>
    </div>
    <div v-if="medications.length === 0" class="text-center py-4">
      No medications found
    </div>
  </div>
</template>
