<script setup> 
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from "@/toast/store/toast";
import { getActiveProviders } from "@/features/providers/api/providerApi";
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";
import { toasted } from '@/utils/utils';
import ButtonSpinner from '@/components/buttonSpinner.vue';
import { createNewContract } from '../api/contractApi';

const router = useRouter();
const toast = useToast();

const formData = ref({
  providerUuid: '',
  contractName: '',
  contractCode: '',
  description: '',
  beginDate: '',
  endDate: '',
  status: 'ACTIVE'
});

const providers = ref([]);
const isLoading = ref(false);
const submitAttempted = ref(false);

onMounted(async () => {
  try {
    isLoading.value = true;
    const response = await getActiveProviders({
      page: 1,
      limit: 25,
      status: "ACTIVE",
      search: ""
    });
    providers.value = response.data;
  } catch (error) {
    toast.error(error.message || "Failed to load providers");
  } finally {
    isLoading.value = false;
  }
});

// Active Step Logic
const steps = [
  { id: 1, title: "Contract Info", ref: ref(null) },
  { id: 2, title: "Contract Period", ref: ref(null) },
  { id: 3, title: "Provider Info", ref: ref(null) },
  { id: 4, title: "Description", ref: ref(null) }
];
const activeStep = ref(1);

const onScroll = () => {
  const scrollPosition = window.scrollY + 100;
  
  for (let i = 0; i < steps.length; i++) {
    const section = steps[i].ref.value;
    if (section) {
      const sectionTop = section.offsetTop;
      const sectionBottom = sectionTop + section.offsetHeight;
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
        activeStep.value = steps[i].id;
        break;
      }
    }
  }
};

onMounted(() => {
  window.addEventListener("scroll", onScroll);
  // Initialize active step on mount
  onScroll();
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});

const scrollToStep = (stepRef) => {
  if (stepRef) {
    window.scrollTo({
      top: stepRef.offsetTop - 80,
      behavior: 'smooth'
    });
  }
};

const isEndDateValid = computed(() => {
  if (!formData.value.beginDate || !formData.value.endDate) return true;
  return new Date(formData.value.endDate) >= new Date(formData.value.beginDate);
});

const submitForm = async () => {
  submitAttempted.value = true;

  if (!formData.value.providerUuid) return toasted(false, "", "Please select a provider");
  if (!formData.value.contractName) return toasted(false, "", "Contract name is required");
  if (!formData.value.contractCode) return toasted(false, "", "Contract code is required");
  if (!formData.value.beginDate) return toasted(false, "", "Effective date is required");
  if (!formData.value.endDate) return toasted(false, "", "End date is required");
  if (!isEndDateValid.value) return toasted(false, "", "End date must be after effective date");

  isLoading.value = true;
  try {
    await createNewContract(formData.value);
    toasted(true, "Contract created successfully");
    router.push('/active_contracts');
  } catch (error) {
    toasted(false, "", error.message || "Failed to create contract");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <DefaultPage title="✨ Create Provider Contract">
    
    <!-- Step Indicator -->
    <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm py-3 mb-4 px-6 rounded-b-xl">
      <div class="flex items-center gap-6 justify-center">
        <template v-for="(step, index) in steps" :key="step.id">
          <div class="flex items-center gap-2 cursor-pointer group" 
               @click="scrollToStep(step.ref.value)">
            <div :class="[ 
              'w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold transition-all duration-300 shadow-sm',
              activeStep === step.id 
                ? 'bg-[#02676B] border-[#02676B] text-white' 
                : 'bg-gray-100 border-gray-300 text-gray-500 group-hover:bg-gray-200'
            ]">
              {{ step.id }}
            </div>
            <span :class="[
              'transition-colors duration-300',
              activeStep === step.id 
                ? 'text-[#02676B] font-semibold' 
                : 'text-gray-500 group-hover:text-gray-700'
            ]">
              {{ step.title }}
            </span>
          </div>
          <div v-if="index < steps.length - 1" 
               :class="[
                 'h-0.5 transition-colors duration-300',
                 activeStep > step.id ? 'bg-[#02676B]' : 'bg-gray-300'
               ]"
               class="w-14">
          </div>
        </template>
      </div>
    </div>

    <!-- Form Sections -->
    <div class="bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl shadow-lg p-6 animate-fadeIn">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Contract Info -->
        <div ref="steps[0].ref" class="glass-card">
          <h3 class="section-title">📄 Contract Information</h3>
          <div class="space-y-4 mt-4">
            <div>
              <label class="floating-label">
                Contract Name
                <input v-model="formData.contractName" placeholder=" " class="input-field"
                      :class="{ 'border-red-500': submitAttempted && !formData.contractName }" />
              </label>
              <p v-if="submitAttempted && !formData.contractName" class="error-message">Required</p>
            </div>
            <div>
              <label class="floating-label">
                Contract Code
                <input v-model="formData.contractCode" placeholder=" " class="input-field"
                      :class="{ 'border-red-500': submitAttempted && !formData.contractCode }" />
              </label>
              <p v-if="submitAttempted && !formData.contractCode" class="error-message">Required</p>
            </div>
          </div>
        </div>

        <!-- Contract Period -->
        <div ref="steps[1].ref" class="glass-card">
          <h3 class="section-title">📅 Contract Period</h3>
          <div class="space-y-4 mt-4">
            <div>
              <label class="floating-label">
                Effective Date
                <input type="date" v-model="formData.beginDate" placeholder=" " class="input-field"
                      :class="{ 'border-red-500': submitAttempted && !formData.beginDate }" />
              </label>
              <p v-if="submitAttempted && !formData.beginDate" class="error-message">Required</p>
            </div>
            <div>
              <label class="floating-label">
                End Date
                <input type="date" v-model="formData.endDate" placeholder=" " class="input-field"
                      :class="{ 'border-red-500': submitAttempted && (!formData.endDate || !isEndDateValid) }" />
              </label>
              <p v-if="submitAttempted && !formData.endDate" class="error-message">Required</p>
              <p v-if="submitAttempted && formData.endDate && !isEndDateValid" class="error-message">Must be after start date</p>
            </div>
          </div>
        </div>

        <!-- Provider Info -->
        <div ref="steps[2].ref" class="glass-card">
          <h3 class="section-title">🏥 Provider Information</h3>
          <div class="space-y-4 mt-4">
            <div>
              <label class="floating-label">
                Provider
                <select v-model="formData.providerUuid" class="input-field"
                        :class="{ 'border-red-500': submitAttempted && !formData.providerUuid }">
                  <option value="" disabled>Select a provider</option>
                  <option v-for="p in providers" :key="p.providerUuid" :value="p.providerUuid">
                    {{ p.providerName }}
                  </option>
                </select>
              </label>
              <p v-if="submitAttempted && !formData.providerUuid" class="error-message">Required</p>
            </div>
            <div>
              <label class="floating-label">
                Status
                <select v-model="formData.status" class="input-field">
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div ref="steps[3].ref" class="glass-card">
          <h3 class="section-title">📝 Description</h3>
          <div class="mt-4">
            <textarea v-model="formData.description" rows="4" placeholder="Type here..."
                      class="input-field w-full h-full min-h-[150px]"></textarea>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-4 border-t pt-6 mt-6">
        <button @click="router.push('/ProviderContracts/Active-Contracts')" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="submitForm" class="btn-primary ripple" :disabled="isLoading">
          <ButtonSpinner v-if="isLoading" class="h-4 w-4" />
          <span v-else v-html="icons.contracts" class="w-4 h-4"></span>
          {{ isLoading ? 'Creating...' : 'Create Contract' }}
        </button>
      </div>
    </div>
  </DefaultPage>
</template>

<style scoped>
@keyframes fadeIn { from {opacity:0; transform:translateY(10px);} to {opacity:1; transform:translateY(0);} }
.animate-fadeIn { animation: fadeIn .4s ease-in-out; }
.section-title { @apply text-lg font-semibold text-[#02676B] pb-2 flex items-center gap-2; }
.glass-card { @apply bg-gray-100 backdrop-blur-md rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200; }
.floating-label { @apply block relative w-full; }
.floating-label input,
.floating-label select,
textarea.input-field {
  @apply w-full p-3 border border-gray-300 rounded-lg bg-transparent outline-none transition-all;
}
.floating-label input:focus,
.floating-label select:focus,
textarea.input-field:focus {
  @apply border-[#02676B] ring-2 ring-[#02676B];
}
.error-message { @apply text-red-500 text-xs mt-1; }
.btn-primary {
  @apply px-5 py-2 bg-[#02676B] text-white font-medium rounded-lg shadow hover:bg-[#02494D] transition-all flex items-center gap-2;
}
.btn-secondary {
  @apply px-5 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition;
}
.ripple { position: relative; overflow: hidden; }
.ripple::after {
  content: "";
  position: absolute;
  background: rgba(255,255,255,0.5);
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 0.6s linear;
}
@keyframes ripple { to { transform: scale(4); opacity: 0; } }
</style>