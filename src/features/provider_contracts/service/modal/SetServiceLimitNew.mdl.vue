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
      () => getServiceByid(props.data),
      (res) => {
        if (res.success) {
          service.value = res.data;
          // Set form values from service data
          limitedPerYear.value = res.data.limitedPerYear || false;
          limitedNumber.value = res.data.limitedNumber || 1;
        }
      }
    );
  } else if (Object.keys(service.value).length) {
    // Set form values from existing service data
    limitedPerYear.value = service.value.limitedPerYear || false;
    limitedNumber.value = service.value.limitedNumber || 1;
  }
});

// Computed service info
const serviceInfo = computed(() => ({
  code: service.value?.itemCode || 'N/A',
  name: service.value?.item || 'Unknown Service',
  category: service.value?.category || 'N/A',
  subCategory: service.value?.subCategory || 'N/A',
  price: service.value?.price || 0,
  status: service.value?.status || 'ACTIVE'
}));

// Validation
const isValid = computed(() => {
  return !limitedPerYear.value || (limitedNumber.value > 0 && limitedNumber.value <= 999);
});

function updateServiceLimit() {
  if (!isValid.value) {
    toasted(false, 'Please enter a valid limit number (1-999)');
    return;
  }

  const eligibleServiceUuid = service.value.eligibleServiceUuid;
  if (!eligibleServiceUuid) {
    toasted(false, 'Service UUID not found');
    return;
  }

  req.send(
    () => setServiceLimitUsage(eligibleServiceUuid, limitedPerYear.value, limitedNumber.value),
    (res) => {
      if (res.success) {
        // Update the store with new limit values
        serviceStore.update(eligibleServiceUuid, { 
          ...service.value, 
          limitedPerYear: limitedPerYear.value,
          limitedNumber: limitedPerYear.value ? limitedNumber.value : 0
        });
        
        toasted(true, `Service limit ${limitedPerYear.value ? 'set to ' + limitedNumber.value + ' per year' : 'removed'}`);
        closeModal();
      } else {
        toasted(false, res.error || 'Failed to update service limit');
      }
    }
  );
}

// Handle increment/decrement
const incrementLimit = () => {
  if (limitedNumber.value < 999) {
    limitedNumber.value++;
  }
};

const decrementLimit = () => {
  if (limitedNumber.value > 1) {
    limitedNumber.value--;
  }
};
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      class="bg-white rounded-xl shadow-xl"
      title="Service Usage Limits"
      subtitle="Configure annual usage restrictions for this service"
    >
      <template #header>
        <div class="px-6 pt-6">
          <h2 class="text-2xl font-bold text-gray-800">Service Usage Limits</h2>
          <p class="mt-1 text-sm text-gray-500">
            Set annual usage restrictions for {{ serviceInfo.name }}
          </p>
        </div>
      </template>

      <!-- Service Info Card -->
      <div class="px-6 py-4">
        <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div class="flex gap-4 items-start">
            <div class="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{{ serviceInfo.name }}</h3>
              <div class="grid grid-cols-2 gap-4 mt-2 text-sm">
                <div>
                  <span class="text-gray-500">Code:</span>
                  <span class="ml-2 font-medium text-gray-900">{{ serviceInfo.code }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Category:</span>
                  <span class="ml-2 font-medium text-gray-900">{{ serviceInfo.category }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Price:</span>
                  <span class="ml-2 font-medium text-gray-900">ETB {{ serviceInfo.price.toLocaleString() }}</span>
                </div>
                <div>
                  <span class="text-gray-500">Status:</span>
                  <span class="px-2 py-1 ml-2 text-xs font-semibold rounded-full"
                    :class="serviceInfo.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                    {{ serviceInfo.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Limit Configuration Form -->
      <div class="px-6 py-4 space-y-6">
        <form id="serviceLimitForm">
          <!-- Enable/Disable Limit -->
          <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <label class="flex gap-2 items-center text-sm font-medium text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Enable Annual Usage Limit
              </label>
              <p class="mt-1 text-xs text-gray-500">Restrict how many times this service can be used per patient per year</p>
            </div>
            <label class="inline-flex relative items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="limitedPerYear"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <!-- Limit Number -->
          <div v-if="limitedPerYear" class="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <label class="block mb-3 text-sm font-medium text-gray-700">
              Maximum Usage Per Year
            </label>
            <div class="flex gap-3 items-center">
              <button
                type="button"
                @click="decrementLimit"
                :disabled="limitedNumber <= 1"
                class="p-2 text-amber-600 bg-amber-100 rounded-lg transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              
              <input
                v-model.number="limitedNumber"
                type="number"
                min="1"
                max="999"
                class="flex-1 px-4 py-3 text-lg font-semibold text-center rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                :class="{ 'border-red-300 ring-2 ring-red-200': !isValid }"
              />
              
              <button
                type="button"
                @click="incrementLimit"
                :disabled="limitedNumber >= 999"
                class="p-2 text-amber-600 bg-amber-100 rounded-lg transition-colors hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <p v-if="!isValid" class="mt-3 text-sm font-medium text-red-600">
              Please enter a valid number between 1 and 999
            </p>
            <p v-else class="mt-3 text-sm text-amber-700">
              <strong>{{ limitedNumber }}</strong> usage(s) allowed per patient per year
            </p>
          </div>

          <!-- Info Box -->
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 mt-0.5 w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="text-sm text-blue-800">
                <p class="mb-2 font-medium">How usage limits work:</p>
                <ul class="space-y-1 text-xs text-blue-700">
                  <li>• When enabled, patients can use this service up to <strong>{{ limitedNumber }}</strong> time(s) per year</li>
                  <li>• The limit automatically resets at the beginning of each calendar year</li>
                  <li>• Patients will receive notifications when approaching their limit</li>
                  <li>• Healthcare providers will be warned if a patient has reached their limit</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>

      <template #bottom>
        <div class="flex gap-4 justify-end p-6 bg-gray-50 rounded-b-xl">
          <Button
            type="secondary"
            class="px-6 py-2 rounded-lg border border-gray-300"
            @click="closeModal"
            :disabled="req.pending.value"
          >
            Cancel
          </Button>
          
          <Button
            class="px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            :pending="req.pending.value"
            @click.prevent="updateServiceLimit"
            :disabled="!isValid"
          >
            <template v-if="!req.pending.value">
              <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              {{ limitedPerYear ? 'Set Limit' : 'Remove Limit' }}
            </template>
            <span v-else>Updating...</span>
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
