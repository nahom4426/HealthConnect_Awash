<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import { getPackages } from '@/features/product_settings/api/coverageApi';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    required: true
  },
  validation: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const internalValue = ref(props.modelValue || []);
const packages = ref([]);
const loading = ref(false);

// Sync with parent
watch(internalValue, (newVal) => {
  emit('update:modelValue', newVal);
}, { deep: true });

// Sync from parent
watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(internalValue.value)) {
    internalValue.value = newVal || [];
  }
});

async function fetchPackages() {
  loading.value = true;
  try {
    const response = await getPackages();
    packages.value = response.data || [];
  } catch (error) {
    console.error('Error fetching packages:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchPackages();
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    
    <div v-if="loading" class="text-sm text-gray-500">
      Loading packages...
    </div>
    
    <div v-else class="space-y-2">
      <div v-for="pkg in packages" :key="pkg.packageUuid" class="flex items-center">
        <input
          :id="`package-${pkg.packageUuid}`"
          type="checkbox"
          v-model="internalValue"
          :value="pkg.packageUuid"
          class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label :for="`package-${pkg.packageUuid}`" class="ml-3 text-sm text-gray-700">
          {{ pkg.packageName }} ({{ pkg.packageCode }})
        </label>
      </div>
      
      <p v-if="packages.length === 0" class="text-sm text-gray-500">
        No packages available
      </p>
    </div>
  </div>
</template>