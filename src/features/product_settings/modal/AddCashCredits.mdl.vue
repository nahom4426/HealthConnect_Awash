<template>
  <ModalParent>
    <NewFormParent
      size="xl"
      title="💳 Add Cash Credits"
      subtitle="Select institution, contract, provider and cash services"
    >
      <div class="space-y-6">
        <!-- Step Indicator -->
        <div class="flex items-center justify-between mb-6">
          <div
            v-for="(step, idx) in steps"
            :key="idx"
            class="flex items-center"
          >
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm',
                currentStep > idx
                  ? 'bg-green-100 text-green-800'
                  : currentStep === idx
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600',
              ]"
            >
              {{ idx + 1 }}
            </div>
            <span class="ml-2 text-sm font-medium text-gray-700">{{ step }}</span>
            <div
              v-if="idx < steps.length - 1"
              :class="[
                'w-12 h-1 mx-2',
                currentStep > idx ? 'bg-green-100' : 'bg-gray-200',
              ]"
            ></div>
          </div>
        </div>

        <!-- Step 1: Select Institution -->
        <div v-if="currentStep === 0" class="space-y-4">
          <label class="block text-sm font-medium text-gray-700">
            Select Institution
          </label>
          <select
            v-model="selectedInstitution"
            @change="onInstitutionChange"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">-- Choose Institution --</option>
            <option
              v-for="contract in institutions"
              :key="contract.payerInstitutionContractUuid"
              :value="contract.payerInstitutionContractUuid"
            >
              {{ contract.contractName }} ({{ contract.contractCode }})
            </option>
          </select>
          <p v-if="selectedInstitution" class="text-sm text-gray-600">
            Benefit: {{ selectedInstitutionData?.benefit || 0 }} | Premium:
            {{ selectedInstitutionData?.premium || 0 }}
          </p>
        </div>

        <!-- Step 2: Select Contract -->
        <div v-if="currentStep === 1" class="space-y-4">
          <label class="block text-sm font-medium text-gray-700">
            Selected Contract
          </label>
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p class="font-medium text-gray-900">
              {{ selectedInstitutionData?.contractName }}
            </p>
            <p class="text-sm text-gray-600">
              Code: {{ selectedInstitutionData?.contractCode }}
            </p>
            <p class="text-sm text-gray-600 mt-2">
              Period:
              {{ formatDate(selectedInstitutionData?.beginDate) }} -
              {{ formatDate(selectedInstitutionData?.endDate) }}
            </p>
          </div>
        </div>

        <!-- Step 3: Select Provider -->
        <div v-if="currentStep === 2" class="space-y-4">
          <label class="block text-sm font-medium text-gray-700">
            Select Provider
          </label>
          <div v-if="loadingProviders" class="text-center py-4">
            <p class="text-gray-600">Loading providers...</p>
          </div>
          <select
            v-else
            v-model="selectedProvider"
            @change="onProviderChange"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">-- Choose Provider --</option>
            <option
              v-for="provider in providers"
              :key="provider.mapContractUuid"
              :value="provider.mapContractUuid"
            >
              {{ provider.providerName }} ({{ provider.payerProviderContractCode }})
            </option>
          </select>
          <p v-if="providers.length === 0" class="text-sm text-red-600">
            No providers available for this contract
          </p>
        </div>

        <!-- Step 4: Select Cash Services -->
        <div v-if="currentStep === 3" class="space-y-4">
          <label class="block text-sm font-medium text-gray-700">
            Select Cash Services
          </label>
          <div v-if="loadingPackages" class="text-center py-4">
            <p class="text-gray-600">Loading services...</p>
          </div>
          <div v-else class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="pkg in packages"
              :key="pkg.packageUuid"
              class="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              @click="togglePackage(pkg.packageUuid)"
            >
              <input
                type="checkbox"
                :checked="selectedPackages.includes(pkg.packageUuid)"
                class="mt-1 w-4 h-4 rounded border-gray-300"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-900">{{ pkg.packageName }}</p>
                <p class="text-sm text-gray-600">
                  {{ pkg.packageCategory }} - {{ pkg.packageDescription }}
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  Limit: {{ pkg.minLimit }} - {{ pkg.maxLimit }}
                </p>
              </div>
            </div>
          </div>
          <p v-if="packages.length === 0" class="text-sm text-red-600">
            No services available
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="flex items-start gap-3 p-4 text-sm text-red-800 bg-red-50 rounded-lg border-l-4 border-red-500"
        >
          <svg
            class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="font-medium">{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Footer -->
      <template #bottom>
        <div class="flex gap-3 justify-between w-full p-4 border-t border-gray-200">
          <Button
            v-if="currentStep > 0"
            @click="previousStep"
            type="secondary"
            size="lg"
            class="border border-gray-300 hover:bg-gray-50"
          >
            Previous
          </Button>
          <div class="flex gap-3 ml-auto">
            <Button
              @click="closeModal"
              type="secondary"
              size="lg"
              class="border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              v-if="currentStep < steps.length - 1"
              @click="nextStep"
              :disabled="!canProceed"
              type="primary"
              size="lg"
              class="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
            <Button
              v-else
              @click="submitCashCredits"
              :pending="submitting"
              type="primary"
              size="lg"
              class="bg-green-600 hover:bg-green-700"
            >
              Add Cash Credits
            </Button>
          </div>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { getIssuedContracts } from "@/features/underwriting/api/underwritingApi";
import { getAlreadyMappedActiveProviders } from "@/features/providers/api/providerApi";
import { getPackages } from "../api/coverageApi";
import { useToast } from "@/toast/store/toast";

const { addToast } = useToast();

const steps = ["Institution", "Contract", "Provider", "Services"];
const currentStep = ref(0);

const institutions = ref([]);
const providers = ref([]);
const packages = ref([]);

const selectedInstitution = ref("");
const selectedProvider = ref("");
const selectedPackages = ref([]);

const loadingProviders = ref(false);
const loadingPackages = ref(false);
const submitting = ref(false);
const errorMessage = ref("");

const selectedInstitutionData = computed(() => {
  return institutions.value.find(
    (i) => i.payerInstitutionContractUuid === selectedInstitution.value
  );
});

const canProceed = computed(() => {
  if (currentStep.value === 0) return selectedInstitution.value !== "";
  if (currentStep.value === 1) return true;
  if (currentStep.value === 2) return selectedProvider.value !== "";
  if (currentStep.value === 3) return selectedPackages.value.length > 0;
  return false;
});

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

async function loadInstitutions() {
  try {
    const response = await getIssuedContracts();
    if (response.success && response.data?.content) {
      institutions.value = response.data.content;
    }
  } catch (error) {
    console.error("Error loading institutions:", error);
    errorMessage.value = "Failed to load institutions";
  }
}

async function onInstitutionChange() {
  selectedProvider.value = "";
  selectedPackages.value = [];
  providers.value = [];
  packages.value = [];
  errorMessage.value = "";
}

async function loadProviders() {
  if (!selectedInstitution.value) return;

  loadingProviders.value = true;
  errorMessage.value = "";

  try {
    const response = await getAlreadyMappedActiveProviders(
      selectedInstitution.value
    );
    if (response.success && response.data) {
      providers.value = Array.isArray(response.data)
        ? response.data
        : response.data.content || [];
    } else {
      providers.value = [];
      errorMessage.value = "No providers available for this contract";
    }
  } catch (error) {
    console.error("Error loading providers:", error);
    errorMessage.value = "Failed to load providers";
    providers.value = [];
  } finally {
    loadingProviders.value = false;
  }
}

async function onProviderChange() {
  selectedPackages.value = [];
  packages.value = [];
}

async function loadPackages() {
  loadingPackages.value = true;
  errorMessage.value = "";

  try {
    const response = await getPackages();
    if (response.success && response.data) {
      packages.value = Array.isArray(response.data)
        ? response.data
        : response.data.content || [];
    } else {
      packages.value = [];
      errorMessage.value = "No services available";
    }
  } catch (error) {
    console.error("Error loading packages:", error);
    errorMessage.value = "Failed to load services";
    packages.value = [];
  } finally {
    loadingPackages.value = false;
  }
}

function togglePackage(packageUuid) {
  const idx = selectedPackages.value.indexOf(packageUuid);
  if (idx > -1) {
    selectedPackages.value.splice(idx, 1);
  } else {
    selectedPackages.value.push(packageUuid);
  }
}

async function nextStep() {
  if (currentStep.value === 1) {
    await loadProviders();
  } else if (currentStep.value === 2) {
    await loadPackages();
  }
  currentStep.value++;
}

function previousStep() {
  currentStep.value--;
}

async function submitCashCredits() {
  submitting.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      payerInstitutionContractUuid: selectedInstitution.value,
      mapContractUuid: selectedProvider.value,
      packageUuids: selectedPackages.value,
    };

    console.log("Submitting cash credits:", payload);

    // TODO: Call API to create cash credits
    // const response = await createCashCredits(payload);

    addToast({
      type: "success",
      message: `Added ${selectedPackages.value.length} cash service(s) successfully`,
    });

    closeModal({ success: true, data: payload });
  } catch (error) {
    console.error("Error submitting cash credits:", error);
    errorMessage.value = error.message || "Failed to add cash credits";
    addToast({
      type: "error",
      message: errorMessage.value,
    });
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadInstitutions();
});
</script>

<style scoped>
/* Custom styles if needed */
</style>
