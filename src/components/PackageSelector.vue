<script setup>
import { onMounted, ref, watch } from 'vue';
import { getPackages, getPackageDropdown } from '@/features/product_settings/api/coverageApi';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, required: true },
  validation: { type: String, default: '' },
  insuredPersonUuid: { type: String, required: true }
});

const emit = defineEmits(['update:modelValue']);

const packagesWithSumAssured = ref([]);
const allPackages = ref([]);
const loading = ref(false);

watch(packagesWithSumAssured, (newVal) => {
  emit('update:modelValue', newVal);
}, { deep: true });

watch(() => props.modelValue, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(packagesWithSumAssured.value)) {
    packagesWithSumAssured.value = newVal || [];
  }
});

async function fetchData() {
  loading.value = true;
  try {
    const packagesResponse = await getPackages();
    allPackages.value = packagesResponse.data || [];
    
    const selectedResponse = await getPackageDropdown(props.insuredPersonUuid);
    const selectedPackages = selectedResponse.data || [];
    
    packagesWithSumAssured.value = allPackages.value.map(pkg => {
      const selectedPkg = selectedPackages.find(sp => sp.packageUuid === pkg.packageUuid);
      return {
        packageUuid: pkg.packageUuid,
        packageName: pkg.packageName,
        packageCode: pkg.packageCode,
        isSelected: !!selectedPkg,
        sumAssured: selectedPkg?.sumAssured || 0
      };
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
  } finally {
    loading.value = false;
  }
}

function updatePackageSelection(pkg, isChecked) {
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index !== -1) {
    packagesWithSumAssured.value[index].isSelected = isChecked;
    if (!isChecked) {
      packagesWithSumAssured.value[index].sumAssured = 0;
    }
  }
}

function updateSumAssured(pkg, value) {
  const index = packagesWithSumAssured.value.findIndex(p => p.packageUuid === pkg.packageUuid);
  if (index !== -1) {
    packagesWithSumAssured.value[index].sumAssured = Number(value) || 0;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <label class="block text-sm font-semibold text-gray-800">
      {{ label }}
    </label>
    
    <div v-if="loading" class="text-sm text-gray-500 animate-pulse">
      Loading packages...
    </div>
    
    <div v-else class="grid gap-4 sm:grid-cols-1">
      <div
        v-for="pkg in packagesWithSumAssured"
        :key="pkg.packageUuid"
        class="transition-all bg-white/70 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:scale-[1.01]"
      >
        <div class="flex items-center">
          <input
            :id="`package-${pkg.packageUuid}`"
            type="checkbox"
            v-model="pkg.isSelected"
            @change="updatePackageSelection(pkg, $event.target.checked)"
            class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
          />
          <label
            :for="`package-${pkg.packageUuid}`"
            class="ml-3 text-sm font-medium text-gray-800"
          >
            {{ pkg.packageName }}
            <span class="text-gray-500">({{ pkg.packageCode }})</span>
          </label>
        </div>
        
        <div v-if="pkg.isSelected" class="mt-3 pl-8 flex items-center gap-3">
          <label class="text-sm text-gray-600 font-medium">Sum Assured:</label>
          <input
            type="number"
            :value="pkg.sumAssured"
            @input="updateSumAssured(pkg, $event.target.value)"
            class="h-9 w-36 px-3 py-1 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
            min="0"
          />
        </div>
      </div>
      
      <p v-if="packagesWithSumAssured.length === 0" class="text-sm text-gray-500">
        No packages available
      </p>
    </div>
  </div>
</template>
