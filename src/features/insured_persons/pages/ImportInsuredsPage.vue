<script setup>
/**
 * ImportInsuredsPage.vue
 * Full-page import wizard replacing the modal approach.
 * Route params:  payerInstitutionContractUuid  (current contract — import INTO)
 * Route query:   renewedFromPayerInstitutionContractUuid  (previous contract — import FROM)
 */
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useImportInsureds } from '../../Nyalaunderwriting/composables/useImportInsureds';
import BenefitGroupSelection from '../../Nyalaunderwriting/components/ImportInsureds/BenefitGroupSelection.vue';
import InsuredSelection from '../../Nyalaunderwriting/components/ImportInsureds/InsuredSelection.vue';

const route = useRoute();
const router = useRouter();

const currentContractUuid = computed(
  () => route.params.payerInstitutionContractUuid || route.params.id || ''
);
const previousContractUuid = computed(
  () => route.query.renewedFromPayerInstitutionContractUuid || ''
);

const {
  currentStep,
  totalSteps,
  isSubmitting,
  isLoading,
  benefitGroups,
  selectedBenefitGroup,
  previousInsureds,
  selectedInsureds,
  selectedCount,
  maxAllowed,
  currentInsuredUuids,
  init,
  nextStep,
  previousStep,
  selectBenefitGroup,
  toggleInsured,
  toggleDependent,
  selectAllEmployees,
  selectAllDependents,
  selectEmployeesWithExactDependents,
  clearAll,
} = useImportInsureds(previousContractUuid.value, currentContractUuid.value);

onMounted(() => {
  if (!previousContractUuid.value) {
    router.back();
    return;
  }
  init();
});

function goBack() {
  router.back();
}

const STEP_LABELS = ['Select Benefit Group', 'Select Insureds'];

function progressWidth() {
  return `${(currentStep.value / totalSteps.value) * 100}%`;
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-50">

    <!-- ── Page Header ── -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
      <div class="max-w-5xl mx-auto flex items-center gap-4">
        <!-- Back button -->
        <button
          @click="goBack"
          class="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          title="Go back"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h1 class="text-base font-semibold text-gray-800">Import Existing Insureds</h1>
            <p class="text-xs text-gray-400">Transfer insured members from the previous contract</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Main Content ── -->
    <div class="flex-1 px-6 py-6">
      <div class="max-w-5xl mx-auto flex flex-col gap-6">

        <!-- Step Indicators + Progress -->
        <div class="bg-white rounded-2xl border border-gray-200 px-6 py-4">
          <div class="flex items-center gap-2 mb-3">
            <div
              v-for="(label, idx) in STEP_LABELS"
              :key="idx"
              class="flex items-center gap-1.5"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200"
                :class="currentStep > idx + 1
                  ? 'bg-purple-600 text-white'
                  : currentStep === idx + 1
                    ? 'bg-purple-600 text-white ring-2 ring-purple-200'
                    : 'bg-gray-100 text-gray-400'"
              >
                <svg v-if="currentStep > idx + 1" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <span
                class="text-sm font-medium transition-colors duration-200"
                :class="currentStep === idx + 1 ? 'text-purple-600' : 'text-gray-400'"
              >
                {{ label }}
              </span>
              <!-- Connector -->
              <div
                v-if="idx < STEP_LABELS.length - 1"
                class="w-16 h-0.5 mx-2 rounded-full transition-colors duration-300"
                :class="currentStep > idx + 1 ? 'bg-purple-400' : 'bg-gray-200'"
              />
            </div>
          </div>
          <!-- Progress bar -->
          <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-purple-500 rounded-full transition-all duration-500"
              :style="{ width: progressWidth() }"
            />
          </div>
        </div>

        <!-- Step Content Card -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6">

          <!-- Step 1: Benefit Group Selection -->
          <template v-if="currentStep === 1">
            <div class="mb-4">
              <h2 class="text-sm font-semibold text-gray-800 mb-1">Select a Benefit Group</h2>
              <p class="text-xs text-gray-500">
                Choose a benefit group from the current contract. Only groups with available slots can be selected.
              </p>
            </div>
            <BenefitGroupSelection
              :benefit-groups="benefitGroups"
              :selected-group="selectedBenefitGroup"
              :is-loading="isLoading"
              @select="selectBenefitGroup"
            />
          </template>

          <!-- Step 2: Insured Selection -->
          <template v-else-if="currentStep === 2">
            <!-- Selected group summary banner -->
            <div
              v-if="selectedBenefitGroup"
              class="mb-5 px-4 py-3 rounded-xl bg-purple-50 border border-purple-100 flex items-center gap-3"
            >
              <svg class="w-4 h-4 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-semibold text-purple-800">
                  {{ selectedBenefitGroup.packageNames?.join(', ') || selectedBenefitGroup.packageName }}
                </span>
                <span class="text-xs text-purple-500 ml-2">
                  ({{ selectedBenefitGroup.planTypes?.join(', ') || selectedBenefitGroup.planType }})
                </span>
                <span class="text-xs text-purple-500 mx-2">·</span>
                <span class="text-xs text-purple-600">
                  {{ selectedBenefitGroup.maxAllowedSlots - selectedBenefitGroup.enrolledSlotsCount }} employee slots available
                </span>
              </div>
              <button
                @click="currentStep = 1"
                class="text-xs text-purple-600 hover:text-purple-800 font-medium underline whitespace-nowrap"
              >
                Change
              </button>
            </div>

            <div class="mb-4">
              <h2 class="text-sm font-semibold text-gray-800 mb-1">Select Insureds to Import</h2>
              <p class="text-xs text-gray-500">
                Pick employees and dependents from the previous contract. Already-enrolled members are grayed out.
              </p>
            </div>

            <InsuredSelection
              :insureds="previousInsureds"
              :selected-insureds="selectedInsureds"
              :current-insured-uuids="currentInsuredUuids"
              :benefit-group="selectedBenefitGroup"
              :selected-count="selectedCount"
              :is-loading="isLoading"
              @toggle="toggleInsured"
              @toggle-dependent="({ insured, dependent }) => toggleDependent(insured, dependent)"
              @select-all-employees="selectAllEmployees"
              @select-all-dependents="selectAllDependents"
              @select-exact-dependents="selectEmployeesWithExactDependents"
              @clear-all="clearAll"
            />
          </template>

        </div>

        <!-- Footer Navigation -->
        <div class="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-6 py-4">
          <!-- Back step -->
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            :disabled="isSubmitting"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div v-else></div>

          <!-- Cancel + Primary -->
          <div class="flex items-center gap-3">
            <button
              @click="goBack"
              :disabled="isSubmitting"
              class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              @click="nextStep"
              :disabled="isSubmitting || (currentStep === 1 && !selectedBenefitGroup)"
              class="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <svg
                v-if="isSubmitting"
                class="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>
                {{ isSubmitting ? 'Importing…' : currentStep === totalSteps ? 'Import' : 'Next' }}
              </span>
              <svg v-if="!isSubmitting && currentStep < totalSteps" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>
