<script setup>
import { onMounted, ref, watch } from 'vue';
import { getPackages } from '@/features/product_settings/api/coverageApi';
import { getServiceQuotedByUuid } from '../api/groupServiceApi';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  validation: { type: String, default: '' },
  serviceQuotedUuid: { type: String, default: '' },
  mode: { type: String, default: 'add' },
  internalScroll: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue']);

const packagesWithSumAssured = ref([]);
const loading = ref(false);

watch(
  packagesWithSumAssured,
  (newVal) => {
    emit('update:modelValue', newVal);
  },
  { deep: true }
);

watch(
  () => props.modelValue,
  (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(packagesWithSumAssured.value)) {
      packagesWithSumAssured.value = newVal || [];
    }
  }
);

function normalizeServiceQuotedResponse(res) {
  if (!res) return null;
  if (Array.isArray(res)) return res?.[0] || null;
  if (Array.isArray(res?.data)) return res.data?.[0] || null;
  if (res?.data && typeof res.data === 'object') return res.data;
  if (typeof res === 'object') return res;
  return null;
}

async function fetchData() {
  try {
    loading.value = true;

    const allPkgsResponse = await getPackages();
    const allPkgs = allPkgsResponse?.data || [];

    let selectedFromApi = null;
    if (props.mode === 'edit' && props.serviceQuotedUuid) {
      const sqRes = await getServiceQuotedByUuid(props.serviceQuotedUuid);
      selectedFromApi = normalizeServiceQuotedResponse(sqRes);
    }

    const selectedPackageUuid =
      selectedFromApi?.packageUuid ||
      selectedFromApi?.package?.packageUuid ||
      selectedFromApi?.packageId ||
      '';

    packagesWithSumAssured.value = allPkgs.map((pkg) => {
      const isSelected = !!(selectedPackageUuid && pkg.packageUuid === selectedPackageUuid);
      return {
        packageUuid: pkg.packageUuid,
        packageName: pkg.packageName,
        packageCode: pkg.packageCode,
        isSelected,
        sumAssured: isSelected ? Number(selectedFromApi?.coverage ?? selectedFromApi?.sumAssured ?? 0) : 0,
        used: isSelected ? Number(selectedFromApi?.used ?? 0) : 0,
        status: selectedFromApi?.status || 'ACTIVE',
        planType: selectedFromApi?.planType || 'Individual_Plan',
        description: selectedFromApi?.description ?? 0,
        quotationUuid: selectedFromApi?.quotationUuid || null,
        deleted: !!selectedFromApi?.deleted,
      };
    });
  } catch (error) {
    console.error('Error fetching group packages:', error);
  } finally {
    loading.value = false;
  }
}

function selectOnly(pkg) {
  packagesWithSumAssured.value = packagesWithSumAssured.value.map((p) => {
    const shouldSelect = p.packageUuid === pkg.packageUuid;
    return {
      ...p,
      isSelected: shouldSelect,
      sumAssured: shouldSelect ? p.sumAssured : 0,
      used: shouldSelect ? p.used : 0,
    };
  });
}

function updateSumAssured(pkg, value) {
  const index = packagesWithSumAssured.value.findIndex((p) => p.packageUuid === pkg.packageUuid);
  if (index !== -1) {
    packagesWithSumAssured.value[index].sumAssured = Number(value) || 0;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <label v-if="label" class="block text-sm font-semibold text-gray-800">
      {{ label }}
    </label>

    <div v-if="loading" class="text-sm text-gray-500 animate-pulse">
      Loading packages...
    </div>

    <div
      v-else
      class="grid gap-4"
      :class="props.internalScroll ? 'overflow-x-auto overflow-y-auto custom-scrollbar max-h-[60vh]' : ''"
    >
      <div
        v-for="pkg in packagesWithSumAssured"
        :key="pkg.packageUuid"
        class="transition-all bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:scale-[1.01]"
      >
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <input
              :id="`package-${pkg.packageUuid}`"
              type="radio"
              name="group-package-selector"
              :checked="pkg.isSelected"
              @change="selectOnly(pkg)"
              class="w-5 h-5 text-blue-600 border-gray-300 transition-all focus:ring-blue-500"
            />
            <label :for="`package-${pkg.packageUuid}`" class="ml-3 text-sm font-medium text-gray-800">
              {{ pkg.packageName }}
              <span class="text-gray-500">({{ pkg.packageCode }})</span>
            </label>
          </div>
        </div>

        <div v-if="pkg.isSelected" class="pl-8 mt-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Sum Assured</label>
              <div class="relative">
                <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                  <span class="text-gray-500 sm:text-sm">ETB</span>
                </div>
                <input
                  type="number"
                  :value="pkg.sumAssured"
                  @input="updateSumAssured(pkg, $event.target.value)"
                  class="py-2 pr-3 pl-10 w-full rounded-lg border border-gray-300 shadow-sm transition-all focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-medium text-gray-600">Plan Type</label>
              <select
                v-model="pkg.planType"
                class="px-3 py-2 w-full rounded-lg border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="Individual_Plan">Individual Plan</option>
                <option value="Family_Plan">Family Plan</option>
                <option value="Family_Shared_Plan">Family Shared Plan</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <p v-if="packagesWithSumAssured.length === 0" class="text-sm text-gray-500">
        No packages available
      </p>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #f3f4f6;
}

:deep(.custom-scrollbar::-webkit-scrollbar) {
  width: 12px;
  height: 12px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-track) {
  background: #e5e7eb;
  border-radius: 6px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb) {
  background: #6b7280;
  border-radius: 6px;
}

:deep(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
  background: #4b5563;
}
</style>
