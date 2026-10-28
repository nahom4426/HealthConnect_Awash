<script setup>
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { useRoute } from "vue-router";
import { useServiceListStore } from "../store/serviceListStore";
import ModalParent from "@/components/ModalParent.vue";
import { ref, watchEffect, computed } from "vue";
import { getServiceByid, setServiceLimitUsage } from "../api/serviceApi.js";
import { closeModal } from "@customizer/modal-x";

const props = defineProps({
  data: Object,
});

const route = useRoute();
const { submit } = useForm("serviceLimitForm");
const serviceStore = useServiceListStore();
const req = useApiRequest();

const service = ref(
  serviceStore.serviceList.find((el) => el.eligibleServiceUuid == props.data) || {}
);

// Form data
const limitedPerYear = ref(false);
const limitedNumber = ref(1);

// Fetch service if not in store
watchEffect(() => {
  if (!Object.keys(service.value).length && props.data) {
    req.send(
      () => getServiceByid(props.data?.eligibleServiceUuid),
      (res) => {
        if (res.success) {
          service.value = res.data;
          limitedPerYear.value = res.data.limitedPerYear || false;
          limitedNumber.value = res.data.limitedNumber || 1;
        }
      }
    );
  } else if (Object.keys(service.value).length) {
    limitedPerYear.value = service.value.limitedPerYear || false;
    limitedNumber.value = service.value.limitedNumber || 1;
  }
});

// Computed service info
const serviceInfo = computed(() => ({
  name: service.value?.item || 'Unknown Service',
  code: service.value?.itemCode || 'N/A',
  price: service.value?.price || 0
}));

// Validation
const isValid = computed(() => {
  return !limitedPerYear.value || (limitedNumber.value > 0 && limitedNumber.value <= 999);
});

function updateServiceLimit() {
  if (!isValid.value) {
    toasted(false, 'Please enter a valid limit (1-999)');
    return;
  }

  const eligibleServiceUuid = service.value.eligibleServiceUuid;
  if (!eligibleServiceUuid) {
    toasted(false, 'Service not found');
    return;
  }

  req.send(
    () => setServiceLimitUsage(eligibleServiceUuid, limitedPerYear.value, limitedNumber.value),
    (res) => {
      if (res.success) {
        serviceStore.update(eligibleServiceUuid, { 
          ...service.value, 
          limitedPerYear: limitedPerYear.value,
          limitedNumber: limitedPerYear.value ? limitedNumber.value : 0
        });
        
        toasted(true, limitedPerYear.value 
          ? `Limit set to ${limitedNumber.value} per year` 
          : 'Limit removed'
        );
        closeModal();
      }
    }
  );
}

const incrementLimit = () => {
  if (limitedNumber.value < 999) limitedNumber.value++;
};

const decrementLimit = () => {
  if (limitedNumber.value > 1) limitedNumber.value--;
};
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="md"
      class="overflow-hidden bg-white rounded-2xl shadow-xl"
        title="Service Usage Limit"
          subtitle="`Set annual usage restrictions for ${ serviceInfo.name || 'This Service'}`" 
    >
      <template #header>
        <div class="px-6 pt-6 pb-4 border-b border-gray-100">
          <div class="flex gap-2 items-center">
            <div class="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h2 class="text-xl font-semibold text-gray-900">Usage Limits</h2>
          </div>
          <p class="mt-2 text-sm text-gray-500">
            Configure annual usage restrictions for this service
          </p>
        </div>
      </template>

      <!-- Service Info Card - Subtle but elegant -->
      <div class="px-6 py-4">
        <div class="flex gap-4 items-center p-4 bg-gradient-to-r from-blue-50 rounded-xl border border-blue-100 to-indigo-50/50">
          <div class="flex justify-center items-center w-12 h-12 bg-blue-600 rounded-xl shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-medium text-gray-900">{{ serviceInfo.name }}</h3>
            <div class="flex gap-3 items-center mt-1 text-xs">
              <span class="text-gray-500">Code: {{ serviceInfo.code }}</span>
              <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span class="font-medium text-blue-600">ETB {{ serviceInfo.price.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Limit Configuration -->
      <div class="px-6 py-2 space-y-6">
        <!-- Toggle Card -->
        <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="flex justify-center items-center w-8 h-8 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Annual limit</label>
                <p class="text-xs text-gray-500">Restrict usage per patient per year</p>
              </div>
            </div>
            <button
              type="button"
              @click="limitedPerYear = !limitedPerYear"
              class="inline-flex relative items-center w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              :class="limitedPerYear ? 'bg-blue-600' : 'bg-gray-200'"
            >
              <span
                class="inline-block w-4 h-4 bg-white rounded-full shadow-sm transition-transform transform"
                :class="limitedPerYear ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
        </div>

        <!-- Limit Input Card -->
        <div v-if="limitedPerYear" class="p-4 rounded-xl border border-amber-100 bg-amber-50/30">
          <div class="space-y-3">
            <div class="flex gap-2 items-center">
              <div class="flex justify-center items-center w-6 h-6 bg-amber-100 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span class="text-sm font-medium text-gray-700">Maximum per year</span>
            </div>
            
            <div class="flex gap-3 items-center">
              <button
                @click="decrementLimit"
                :disabled="limitedNumber <= 1"
                class="flex justify-center items-center w-10 h-10 text-amber-600 bg-white rounded-lg border border-amber-200 transition-colors hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40"
              >
                <span class="text-lg">−</span>
              </button>
              
              <div class="relative flex-1">
                <input
                  v-model.number="limitedNumber"
                  type="number"
                  min="1"
                  max="999"
                  class="px-3 w-full h-10 text-lg font-medium text-center bg-white rounded-lg border focus:outline-none focus:ring-2"
                  :class="isValid ? 'border-amber-200 focus:border-amber-300 focus:ring-amber-100' : 'border-red-300 focus:border-red-300 focus:ring-red-100'"
                />
                <span class="absolute right-3 top-1/2 text-xs text-gray-400 -translate-y-1/2">/year</span>
              </div>
              
              <button
                @click="incrementLimit"
                :disabled="limitedNumber >= 999"
                class="flex justify-center items-center w-10 h-10 text-amber-600 bg-white rounded-lg border border-amber-200 transition-colors hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40"
              >
                <span class="text-lg">+</span>
              </button>
            </div>
            
            <div class="flex gap-2 items-center">
              <div class="overflow-hidden flex-1 h-1.5 bg-amber-100 rounded-full">
                <div 
                  class="h-full bg-amber-400 rounded-full transition-all duration-300"
                  :style="{ width: `${(limitedNumber / 999) * 100}%` }"
                ></div>
              </div>
              <span class="text-xs font-medium text-amber-600">{{ limitedNumber }} of 999</span>
            </div>
            
            <p v-if="!isValid" class="text-xs text-red-600">
              Please enter a number between 1 and 999
            </p>
          </div>
        </div>

        <!-- Info Note - Subtle but helpful -->
        <div class="flex gap-3 items-start p-3 rounded-lg border border-blue-100 bg-blue-50/50">
          <div class="flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-xs text-gray-600">
            <span class="font-medium text-blue-600">Note:</span> Limits reset annually. 
            {{ limitedPerYear ? `Patients can use this service ${limitedNumber} time${limitedNumber > 1 ? 's' : ''} per year.` : 'Enable limits to restrict usage.' }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <template #bottom>
        <div class="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div class="text-xs text-gray-400">
            Changes take effect immediately
          </div>
          <div class="flex gap-2">
            <Button
              type="secondary"
              class="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 transition-colors hover:bg-gray-50 hover:border-gray-300"
              @click="closeModal"
              :disabled="req.pending.value"
            >
              Cancel
            </Button>
            
            <Button
              class="relative px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              :pending="req.pending.value"
              @click.prevent="updateServiceLimit"
              :disabled="!isValid"
            >
              <span v-if="!req.pending.value" class="flex gap-2 items-center">
                <svg v-if="limitedPerYear" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ limitedPerYear ? 'Apply Limit' : 'Remove Limit' }}
              </span>
              <span v-else class="flex gap-2 items-center">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Saving...
              </span>
            </Button>
          </div>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.2s ease-out;
}
</style>