<script setup>
import { ref, onMounted, computed } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import Form from "@/components/new_form_builder/Form.vue";
import Button from "@/components/Button.vue";
import Toggle from "@/components/new_form_elements/Toggle.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from '@/utils/utils';
import { getPackages } from '@/features/product_settings/api/coverageApi';
import { getBenefitContributions, updateBenefitContributions, deleteBenefitContribution } from '../api/underwritingApi';

const props = defineProps({
  data: Object // Contains payerInstitutionContractUuid and contract
});

const apiRequest = useApiRequest();
const packagesList = ref([]);
const loading = ref(true);
const selectAll = ref(false);
const bulkPercentage = ref(0);

const contractUuid = computed(() => props.data?.payerInstitutionContractUuid || props.data?.contract?.payerInstitutionContractUuid);

const selectedCount = computed(() => packagesList.value.filter(p => p.isSelected).length);

async function fetchData() {
  try {
    loading.value = true;
    const [pkgRes, contribRes] = await Promise.all([
      getPackages(),
      getBenefitContributions(contractUuid.value)
    ]);

    const allPkgs = Array.isArray(pkgRes?.data) ? pkgRes.data : (Array.isArray(pkgRes) ? pkgRes : []);

    let existingContribs = [];
    if (Array.isArray(contribRes?.data?.content)) {
      existingContribs = contribRes.data.content;
    } else if (Array.isArray(contribRes?.data)) {
      existingContribs = contribRes.data;
    } else if (Array.isArray(contribRes?.content)) {
      existingContribs = contribRes.content;
    } else if (Array.isArray(contribRes)) {
      existingContribs = contribRes;
    }

    const contribMap = new Map();
    existingContribs.forEach(c => {
      contribMap.set(c.packageUuid || c.benefitPackageUuid, c);
    });

    packagesList.value = allPkgs.map(pkg => {
      const existing = contribMap.get(pkg.packageUuid || pkg.uuid);
      return {
        packageUuid: pkg.packageUuid || pkg.uuid,
        packageName: pkg.packageName,
        packageCode: pkg.packageCode,
        isSelected: !!existing,
        contributionPercentage: existing ? existing.contributionPercentage : 0,
        benefitContributionUuid: existing ? existing.benefitContributionUuid : null,
        benefitPooling: existing ? existing.benefitPooling : false,
        benefitPoolingFrom: existing ? existing.benefitPoolingFrom : null
      };
    });

    updateSelectAllState();
  } catch (error) {
    console.error('Error fetching data:', error);
    toasted(false, "", "Failed to load benefit contributions");
  } finally {
    loading.value = false;
  }
}

function updateSelectAllState() {
  if (packagesList.value.length === 0) {
    selectAll.value = false;
    return;
  }
  selectAll.value = packagesList.value.every(p => p.isSelected);
}

function toggleSelectAll(event) {
  const isChecked = event.target.checked;
  packagesList.value.forEach(p => {
    p.isSelected = isChecked;
  });
}

// Live-applies the bulk percentage to every currently selected package
function applyBulkPercentage() {
  packagesList.value.forEach(pkg => {
    if (pkg.isSelected) {
      pkg.contributionPercentage = Number(bulkPercentage.value);
    }
  });
}

function getShareOptions(currentUuid) {
  return packagesList.value
    .filter(p => p.packageUuid !== currentUuid)
    .map(p => ({ value: p.packageUuid, label: p.packageName }));
}

function sliderBackground(value) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return `linear-gradient(to right, #4f46e5 0%, #6366f1 ${v}%, #e5e7eb ${v}%, #e5e7eb 100%)`;
}

async function handleSubmit() {
  const selected = packagesList.value.filter(pkg => pkg.isSelected);
  const deselected = packagesList.value.filter(pkg => !pkg.isSelected && pkg.benefitContributionUuid);

  const payload = selected.map(pkg => ({
    benefitPackageUuid: pkg.packageUuid,
    contributionPercentage: Number(pkg.contributionPercentage) || 0,
    benefitPooling: !!pkg.benefitPooling,
    benefitPoolingFrom: pkg.benefitPooling ? (pkg.benefitPoolingFrom || null) : null
  }));

  try {
    apiRequest.pending.value = true;
    
    // Process deletions
    if (deselected.length > 0) {
      await Promise.all(deselected.map(pkg => deleteBenefitContribution(pkg.benefitContributionUuid)));
    }

    // Process additions/updates
    if (payload.length > 0) {
      const res = await updateBenefitContributions(contractUuid.value, payload);
      if (res?.success || res?.status === 200 || !res?.error) {
        toasted(true, "Success", "Benefit contributions updated successfully!");
        closeModal();
      } else {
        toasted(false, "Error", res?.error || "Failed to update contributions");
      }
    } else {
      toasted(true, "Success", "Benefit contributions updated successfully!");
      closeModal();
    }
  } catch (err) {
    console.error('Submit error:', err);
    toasted(false, "Error", "Failed to process benefit contributions");
  } finally {
    apiRequest.pending.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xmd"
      class="flex flex-col max-h-[90vh] overflow-hidden"
      title="Manage Benefit Contributions"
      :subtitle="`Set contribution percentages for policy ${props.data?.contract?.policyNumber || ''}`"
    >
      <div class="overflow-y-auto overflow-x-hidden form-scrollbar bg-gray-50/50">
        <Form
          class="p-6 space-y-5"
          id="manageContributionsForm"
          @submit.prevent="handleSubmit"
        >
          <div v-if="loading" class="flex justify-center py-12">
            <div class="w-9 h-9 rounded-full border-4 border-indigo-100 animate-spin border-t-indigo-600"></div>
          </div>

          <div v-else class="space-y-5">
            <!-- Header row -->
            <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <label for="selectAll" class="flex items-center gap-3 cursor-pointer select-none">
                <input
                  id="selectAll"
                  type="checkbox"
                  v-model="selectAll"
                  @change="toggleSelectAll"
                  class="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span class="font-semibold text-gray-900">Select All Benefits</span>
              </label>
              <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {{ selectedCount }} / {{ packagesList.length }} selected
              </span>
            </div>

            <!-- Bulk percentage control -->
            <transition name="fade-slide">
              <div
                v-if="selectedCount > 0"
                class="flex items-center gap-4 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 shadow-sm"
              >
                <label class="shrink-0 text-sm font-semibold text-indigo-900">
                  Apply to all {{ selectedCount }} selected
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  v-model="bulkPercentage"
                  @input="applyBulkPercentage"
                  class="modern-slider flex-1"
                  :style="{ background: sliderBackground(bulkPercentage) }"
                />
                <div class="relative w-24 shrink-0">
                  <input
                    type="number"
                    v-model="bulkPercentage"
                    @input="applyBulkPercentage"
                    min="0"
                    max="100"
                    class="py-2 pr-7 pl-3 w-full text-sm font-semibold text-right text-indigo-900 bg-white rounded-lg border border-indigo-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
                  />
                  <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-500 pointer-events-none">%</span>
                </div>
              </div>
            </transition>

            <!-- Package list -->
            <div class="grid gap-2.5 max-h-[48vh] overflow-y-auto pr-1 custom-scrollbar">
              <div
                v-for="pkg in packagesList"
                :key="pkg.packageUuid"
                class="flex flex-col p-4 rounded-xl border transition-all duration-150"
                :class="pkg.isSelected
                  ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'"
              >
                <!-- Row for checkbox, name, slider -->
                <div class="flex items-center w-full">
                  <input
                    :id="`pkg-${pkg.packageUuid}`"
                    type="checkbox"
                    v-model="pkg.isSelected"
                    @change="updateSelectAllState"
                    class="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 shrink-0 cursor-pointer"
                  />

                  <label
                    :for="`pkg-${pkg.packageUuid}`"
                    class="flex-1 ml-3.5 min-w-0 cursor-pointer"
                  >
                    <div class="text-sm font-semibold text-gray-900 truncate">{{ pkg.packageName }}</div>
                    <div class="text-xs text-gray-400">{{ pkg.packageCode }}</div>
                  </label>

                  <div v-if="pkg.isSelected" class="flex items-center gap-3 ml-4 w-64 shrink-0">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      v-model="pkg.contributionPercentage"
                      class="modern-slider flex-1"
                      :style="{ background: sliderBackground(pkg.contributionPercentage) }"
                    />
                    <div class="relative w-20 shrink-0">
                      <input
                        type="number"
                        v-model="pkg.contributionPercentage"
                        class="py-1.5 pr-6 pl-2.5 w-full text-sm font-medium text-right text-gray-800 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
                        min="0"
                        max="100"
                      />
                      <span class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </div>
                  </div>
                </div>

                <!-- Expanded area for benefit pooling -->
                <div v-if="pkg.isSelected" class="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">
                  <Toggle
                    v-model="pkg.benefitPooling"
                    :name="'benefitPooling_' + pkg.packageUuid"
                    label="Benefit Pooling"
                    description="Enable benefit pooling across packages - unused benefits from other packages can be utilized when this package's coverage limit is reached"
                  />
                  <div v-if="pkg.benefitPooling" class="pl-11">
                    <Select
                      v-model="pkg.benefitPoolingFrom"
                      :name="'benefitPoolingFrom_' + pkg.packageUuid"
                      :obj="true"
                      :options="getShareOptions(pkg.packageUuid)"
                      :validation="pkg.benefitPooling ? 'required' : ''"
                      label="Select Source Package"
                      :attributes="{
                        placeholder: 'Choose a package to share benefits from',
                      }"
                    />
                  </div>
                </div>
              </div>

              <div v-if="packagesList.length === 0" class="py-10 text-center text-gray-400 text-sm">
                No benefit packages available
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              @click="closeModal"
              class="px-4 py-2 bg-white border border-primary rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              html-type="submit"
              class="px-4 py-2 text-white bg-primary rounded-lg"
              :pending="apiRequest.pending.value"
            >
              Save Contributions
            </Button>
          </div>
        </Form>
      </div>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Modern slider styling */
.modern-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.modern-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4f46e5;
  border: 3px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.modern-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
}

.modern-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4f46e5;
  border: 3px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.2);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.modern-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.4);
}

.modern-slider::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: transparent;
}

/* Bulk panel enter/leave transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>