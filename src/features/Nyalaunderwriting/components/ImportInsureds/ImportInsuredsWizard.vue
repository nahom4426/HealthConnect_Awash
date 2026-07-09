<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useImportInsureds } from '../../composables/useImportInsureds';
import BenefitGroupSelection from './BenefitGroupSelection.vue';
import InsuredSelection from './InsuredSelection.vue';

const props = defineProps({
  previousContractUuid: { type: String, required: true },
  currentContractUuid: { type: String, required: true },
});

const emit = defineEmits(['close']);

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
  selectEmployeesWithMinDependents,
  clearAll,
} = useImportInsureds(props.previousContractUuid, props.currentContractUuid);

onMounted(() => {
  init();
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
  if (e.key === 'Escape') emit('close');
}

function handleClose() {
  emit('close');
}

const STEP_LABELS = ['Select Benefit Group', 'Select Insureds'];

function progressWidth() {
  return `${(currentStep.value / totalSteps.value) * 100}%`;
}
</script>

<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    style="background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);"
    @click.self="handleClose"
  >
    <!-- Modal Card -->
    <div
      class="relative bg-white rounded-2xl shadow-2xl w-full flex flex-col"
      style="max-width: 900px; max-height: 90vh;"
      @click.stop
    >

      <!-- ── Header ── -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center gap-3">
          <!-- Icon -->
          <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-800">Import Existing Insureds</h2>
            <p class="text-xs text-gray-400 mt-0.5">
              Step {{ currentStep }} of {{ totalSteps }} — {{ STEP_LABELS[currentStep - 1] }}
            </p>
          </div>
        </div>

        <!-- Close Button -->
        <button
          @click="handleClose"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- ── Step Indicators + Progress Bar ── -->
      <div class="px-6 pt-4 pb-3 flex-shrink-0">
        <!-- Step Dots -->
        <div class="flex items-center gap-2 mb-3">
          <div
            v-for="(label, idx) in STEP_LABELS"
            :key="idx"
            class="flex items-center gap-1.5"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200"
              :class="currentStep > idx + 1
                ? 'bg-blue-600 text-white'
                : currentStep === idx + 1
                  ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                  : 'bg-gray-100 text-gray-400'"
            >
              <svg v-if="currentStep > idx + 1" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span
              class="text-xs font-medium transition-colors duration-200"
              :class="currentStep === idx + 1 ? 'text-blue-600' : 'text-gray-400'"
            >
              {{ label }}
            </span>
            <!-- Connector line -->
            <div
              v-if="idx < STEP_LABELS.length - 1"
              class="w-10 h-0.5 mx-1 rounded-full transition-colors duration-300"
              :class="currentStep > idx + 1 ? 'bg-blue-400' : 'bg-gray-200'"
            />
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 rounded-full transition-all duration-500"
            :style="{ width: progressWidth() }"
          />
        </div>
      </div>

      <!-- ── Content Area ── -->
      <div class="flex-1 overflow-y-auto px-6 pb-4 min-h-0">

        <!-- Step 1: Benefit Group Selection -->
        <template v-if="currentStep === 1">
          <div class="mb-3">
            <p class="text-sm text-gray-500">
              Choose a benefit group from the previous contract. Only groups with available slots can be selected.
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
            class="mb-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3"
          >
            <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <div class="flex-1 min-w-0">
              <span class="text-sm font-semibold text-blue-800">{{ selectedBenefitGroup.packageName }}</span>
              <span class="text-xs text-blue-500 ml-2">{{ selectedBenefitGroup.benefitGroupCode }}</span>
              <span class="text-xs text-blue-500 mx-2">·</span>
              <span class="text-xs text-blue-600">
                {{ selectedBenefitGroup.maxAllowedSlots - selectedBenefitGroup.enrolledSlotsCount }} slots available
              </span>
            </div>
            <button
              @click="currentStep = 1"
              class="text-xs text-blue-600 hover:text-blue-800 font-medium underline whitespace-nowrap flex-shrink-0"
            >
              Change
            </button>
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
            @select-min-dependents="selectEmployeesWithMinDependents"
            @clear-all="clearAll"
          />
        </template>

      </div>

      <!-- ── Footer ── -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-2xl">
        <!-- Back / spacer -->
        <div>
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
        </div>

        <!-- Cancel + Primary -->
        <div class="flex items-center gap-2">
          <button
            @click="handleClose"
            :disabled="isSubmitting"
            class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            @click="nextStep"
            :disabled="isSubmitting || (currentStep === 1 && !selectedBenefitGroup)"
            class="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <!-- Spinner when submitting -->
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
</template>
