<template>
  <div class="quotation-builder">
    <!-- Step 1: Package Selection -->
    <div v-if="showHeaderControls" class="mb-8">
      <div class="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Create New Quotation</h2>
          <p class="mt-1 text-sm text-gray-500">Select coverage types and configure services</p>
        </div>
        
        <div v-if="selectedPackages.length > 0" class="flex gap-3 items-center">
          <span class="inline-flex items-center px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-full">
            {{ selectedPackages.length }} selected
          </span>
          
          <label class="inline-flex gap-2 items-center text-sm text-gray-600 cursor-pointer">
            <input
              v-model="editPackages"
              type="checkbox"
              class="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            Edit Packages
          </label>
        </div>
      </div>

      <!-- Package Cards Grid -->
      <div v-if="selectedPackages.length === 0 || editPackages" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="pkg in allPackages"
          :key="pkg.packageUuid"
          @click="togglePackageSelection(pkg.packageUuid)"
          class="relative p-6 bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer group hover:shadow-lg"
          :class="isPackageSelected(pkg.packageUuid) 
            ? 'border-primary ring-2 ring-primary/20 shadow-md' 
            : 'border-gray-200 hover:border-primary/30'"
        >
          <!-- Selection Indicator -->
          <div class="absolute top-3 right-3">
            <div 
              class="flex justify-center items-center w-6 h-6 rounded-full border-2 transition-all"
              :class="isPackageSelected(pkg.packageUuid) ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-primary/50'"
            >
              <svg v-if="isPackageSelected(pkg.packageUuid)" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>

          <!-- Package Content -->
          <div class="mb-4">
            <div class="flex gap-3 items-start">
              <div class="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-primary rounded-xl">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-lg font-semibold text-gray-900 truncate">{{ pkg.packageName }}</h3>
                <span class="inline-block px-2 py-1 mt-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  {{ pkg.packageCategory }}
                </span>
              </div>
            </div>
          </div>

          <!-- Limits -->
          <div class="p-4 space-y-2 bg-gray-50 rounded-xl">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Min Limit</span>
              <span class="font-medium text-gray-700">{{ formatCurrency(getPackageMinLimit(pkg.packageUuid)) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Max Limit</span>
              <span class="font-medium text-gray-700">{{ formatCurrency(getPackageMaxLimit(pkg.packageUuid)) }}</span>
            </div>
          </div>

          <!-- Gender Badge -->
          <div v-if="pkg.gender" class="mt-3">
            <span class="inline-flex gap-1 items-center px-3 py-1 text-xs font-medium rounded-full" 
                  :class="pkg.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700' : 'bg-gray-100 text-gray-600'">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {{ pkg.gender === 'FEMALE' ? 'Female Only' : 'All Genders' }}
            </span>
          </div>

          <!-- Loading State -->
          <div v-if="loadingRates[pkg.packageUuid]" class="flex gap-2 items-center mt-3 text-xs text-gray-500">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Loading rates...
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Service Configuration -->
    <div v-if="selectedPackages.length > 0" class="space-y-6">
      <div
        v-for="(packageUuid, index) in selectedPackages"
        :key="packageUuid"
        class="overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm"
      >
        <!-- Package Header -->
        <div class="px-6 py-4 bg-primary/5 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-4 items-center">
              <div class="flex justify-center items-center w-8 h-8 text-sm font-bold text-white bg-primary rounded-full">
                {{ index + 1 }}
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ getPackageName(packageUuid) }}</h3>
                <p class="text-xs text-gray-500">Configure services and coverage amounts</p>
              </div>
            </div>
            <Button
              v-if="!readOnlyRows"
              @click="deselectPackage(packageUuid)"
              class="px-3 py-1.5 text-sm text-red-600 rounded-lg transition-colors hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          </div>
        </div>

        <!-- Services Table -->
        <div class="p-6">
          <!-- Mobile Cards -->
          <div class="block space-y-4 lg:hidden">
            <div
              v-for="(service, serviceIndex) in getPackageServices(packageUuid)"
              :key="`service-${serviceIndex}`"
              class="p-4 space-y-4 bg-gray-50 rounded-xl"
            >
              <div class="grid grid-cols-2 gap-3">
                <!-- Insured -->
                <div>
                  <label class="block mb-1 text-xs font-medium text-gray-700">Insured</label>
                  <QuotaionInput
                    v-model="service.numberOfInsured"
                    validation="required|num"
                    name="numberOfInsured"
                    @update:modelValue="() => updateLastUsedValues(service)"
                    :attributes="{
                      placeholder: '0',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm text-center focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                </div>

                <!-- Plan Type -->
                <div>
                  <label class="block mb-1 text-xs font-medium text-gray-700">Plan Type</label>
                  <QuotationSelect
                    :obj="true"
                    v-model="service.planType"
                    validation="required"
                    name="rowPlanType"
                    :options="getPlanOptionsForPackage(packageUuid, serviceIndex)"
                    @update:modelValue="() => handlePlanTypeChange(service, packageUuid)"
                    :attributes="{
                      placeholder: 'Select plan',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                </div>

                <!-- Description -->
                <div>
                  <label class="block mb-1 text-xs font-medium text-gray-700">Description</label>
                  <QuotationSelect
                    :obj="true"
                    v-model="service.description"
                    validation="required"
                    name="description"
                    :options="getDescriptionOptions(packageUuid, service.planType, serviceIndex)"
                    @update:modelValue="() => handleDescriptionChange(service, packageUuid)"
                    :attributes="{
                      placeholder: 'Select',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                </div>

                <!-- Sum Insured -->
                <div>
                  <label class="block mb-1 text-xs font-medium text-gray-700">Sum Insured</label>
                  <QuotaionInput
                    v-model="service.coverage"
                    :validation="getCoverageValidationForService(service, packageUuid)"
                    name="coverage"
                    @update:modelValue="() => updatePremium(service, packageUuid)"
                    :attributes="{
                      placeholder: 'Amount',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm text-right focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                  <p class="mt-1 text-xs text-gray-500">Range: {{ getRangeDisplayForService(service, packageUuid) }}</p>
                </div>

                <!-- Rate & Premium -->
                <div>
                  <label class="block mb-1 text-xs font-medium text-gray-700">Rate</label>
                  <QuotaionInput
                    :value="formatRate(service.rate)"
                    name="rate"
                    :attributes="{
                      disabled: true,
                      class: 'w-full h-10 rounded-lg bg-gray-100 border-gray-200 text-sm text-right font-medium text-primary'
                    }"
                  />
                </div>

                <div>
                  <label class="block mb-1 text-xs font-medium text-gray-700">Premium</label>
                  <QuotaionInput
                    :value="formatCurrency(calculatePremium(service))"
                    name="premium"
                    :attributes="{
                      disabled: true,
                      class: 'w-full h-10 rounded-lg bg-green-50 border-gray-200 text-sm text-right font-semibold text-green-700'
                    }"
                  />
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2 justify-end items-center pt-2 border-t border-gray-200">
                <button
                  v-if="!readOnlyRows && getPackageServices(packageUuid).length > 1"
                  @click="removeServiceFromPackage(packageUuid, serviceIndex)"
                  class="p-2 text-red-600 rounded-lg transition-colors hover:bg-red-50"
                  title="Remove"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                  </svg>
                </button>
                <button
                  v-if="!readOnlyRows"
                  @click="duplicateServiceInPackage(packageUuid, service)"
                  class="p-2 text-primary rounded-lg transition-colors hover:bg-primary/10"
                  title="Duplicate"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop Table -->
          <div class="hidden lg:block">
            <div class="grid grid-cols-12 gap-4 px-4 py-3 mb-3 text-xs font-medium tracking-wider text-gray-600 uppercase bg-gray-50 rounded-lg">
              <div class="col-span-2">Insured</div>
              <div class="col-span-2">Plan Type</div>
              <div class="col-span-2">Description</div>
              <div class="col-span-2">Sum Insured</div>
              <div class="col-span-1 text-right">Rate</div>
              <div class="col-span-2 text-right">Premium</div>
              <div class="col-span-1 text-right">Action</div>
            </div>

            <div class="space-y-3">
              <div
                v-for="(service, serviceIndex) in getPackageServices(packageUuid)"
                :key="`service-${serviceIndex}`"
                class="grid grid-cols-12 gap-4 items-start px-4 py-4 bg-white rounded-lg border border-gray-100 transition-colors hover:bg-gray-50/50"
              >
                <div class="col-span-2">
                  <QuotaionInput
                    v-model="service.numberOfInsured"
                    validation="required|num"
                    name="numberOfInsured"
                    @update:modelValue="() => updateLastUsedValues(service)"
                    :attributes="{
                      placeholder: '0',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm text-center focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                </div>

                <div class="col-span-2">
                  <QuotationSelect
                    :obj="true"
                    v-model="service.planType"
                    validation="required"
                    name="rowPlanType"
                    :options="getPlanOptionsForPackage(packageUuid, serviceIndex)"
                    @update:modelValue="() => handlePlanTypeChange(service, packageUuid)"
                    :attributes="{
                      placeholder: 'Select plan',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                </div>

                <div class="col-span-2">
                  <QuotationSelect
                    :obj="true"
                    v-model="service.description"
                    validation="required"
                    name="description"
                    :options="getDescriptionOptions(packageUuid, service.planType, serviceIndex)"
                    @update:modelValue="() => handleDescriptionChange(service, packageUuid)"
                    :attributes="{
                      placeholder: 'Select',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                </div>

                <div class="col-span-2">
                  <QuotaionInput
                    v-model="service.coverage"
                    :validation="getCoverageValidationForService(service, packageUuid)"
                    name="coverage"
                    @update:modelValue="() => updatePremium(service, packageUuid)"
                    :attributes="{
                      placeholder: 'Amount',
                      class: 'w-full h-10 rounded-lg border-gray-300 text-sm text-right focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }"
                  />
                  <p class="mt-1 text-xs text-right text-gray-500">
                    Range: {{ getRangeDisplayForService(service, packageUuid) }}
                  </p>
                </div>

                <div class="col-span-1">
                  <QuotaionInput
                    :value="formatRate(service.rate)"
                    name="rate"
                    :attributes="{
                      disabled: true,
                      class: 'w-full h-10 rounded-lg bg-gray-100 border-gray-200 text-sm text-right font-medium text-primary'
                    }"
                  />
                </div>

                <div class="col-span-2">
                  <QuotaionInput
                    :value="formatCurrency(calculatePremium(service))"
                    name="premium"
                    :attributes="{
                      disabled: true,
                      class: 'w-full h-10 rounded-lg bg-green-50 border-gray-200 text-sm text-right font-semibold text-green-700'
                    }"
                  />
                </div>

                <div class="flex col-span-1 gap-1 justify-end">
                  <button
                    v-if="!readOnlyRows && getPackageServices(packageUuid).length > 1"
                    @click="removeServiceFromPackage(packageUuid, serviceIndex)"
                    class="p-2 text-red-600 rounded-lg transition-colors hover:bg-red-50"
                    title="Remove"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                    </svg>
                  </button>
                  <button
                    v-if="!readOnlyRows"
                    @click="duplicateServiceInPackage(packageUuid, service)"
                    class="p-2 text-primary rounded-lg transition-colors hover:bg-primary/10"
                    title="Duplicate"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Row Button -->
          <div v-if="!readOnlyRows" class="pt-4 mt-4 border-t border-gray-200">
            <button
              @click="addServiceToPackage(packageUuid)"
              class="inline-flex gap-2 items-center px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-xl transition-colors hover:bg-primary/20"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Service Row
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="selectedPackages.length === 0 && showHeaderControls"
      class="flex flex-col items-center px-4 py-16 bg-gray-50 rounded-2xl border-2 border-gray-300 border-dashed"
    >
      <div class="flex justify-center items-center mb-6 w-20 h-20 bg-primary/10 rounded-full">
        <svg class="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <h3 class="mb-2 text-lg font-semibold text-gray-900">No Coverage Selected</h3>
      <p class="max-w-md text-sm text-center text-gray-500">
        Choose from the available coverage packages above to start building your quotation
      </p>
    </div>

    <!-- Footer Actions -->
    <div v-if="selectedPackages.length > 0 && !hideFooterActions" class="pt-6 mt-8 border-t border-gray-200">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-sm text-gray-600">
          <span class="font-medium">{{ selectedPackages.length }}</span> package{{ selectedPackages.length > 1 ? 's' : '' }} selected
        </div>
        
        <div class="flex flex-wrap gap-3">
          <Button 
            v-if="showAmendButton"
            type="secondary" 
            :disabled="!!pendingAction"
            :pending="pendingAction === 'amend'"
            @click="$emit('amend')"
            class="px-6 py-2.5 text-sm font-medium rounded-xl border border-gray-300 transition-colors hover:bg-gray-50"
          >
            Amend Quotation
          </Button>
          
          <Button 
            v-if="showIssuePremiumAdvice"
            type="primary" 
            :disabled="!!pendingAction || !formIsValid"
            :pending="pendingAction === 'issuePremiumAdvice'"
            @click="submitAction('issuePremiumAdvice')"
            class="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-xl shadow-sm transition-all hover:bg-purple-700"
          >
            Issue Premium Advice
          </Button>
          
          <Button 
            v-else-if="issueMode"
            type="primary" 
            :disabled="!!pendingAction || !formIsValid"
            :pending="pendingAction === 'accept'"
            @click="submitAction('accept')"
            class="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl shadow-sm transition-all hover:bg-green-700"
          >
            {{ acceptLabel }}
          </Button>
          
          <template v-else-if="!acceptMode">
            <Button 
              :disabled="!formIsValid"
              @click="submitAction('save')"
              class="px-6 py-2.5 text-sm font-medium rounded-xl border border-gray-300 transition-colors hover:bg-gray-50"
            >
              Save Draft
            </Button>
            
            <Button 
              :disabled="!formIsValid"
              @click="submitAction('issue')"
              class="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl shadow-sm transition-all"
            >
              Issue Quotation
            </Button>
          </template>
          
          <template v-else>
            <Button 
              :disabled="!formIsValid"
              @click="submitAction('save')"
              class="px-6 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-xl transition-colors hover:bg-primary/20"
            >
              Save Changes
            </Button>
            
            <Button 
              :disabled="!formIsValid"
              @click="submitAction('issue')"
              class="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl shadow-sm transition-all"
            >
              Issue Saved
            </Button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Button from "@/components/Button.vue";
import QuotaionInput from "../components/QuotaionInput.vue";
import QuotationSelect from "../components/QuotationSelect.vue";
import {
  allMemberTYpes,
  getFamilyTypes,
  isFemaleOnlyPackage,
  Plan,
} from "@/types/interface";
import { formatCurrency, formatNumber, genId } from "@/utils/utils";
import { getPackageRate } from "@/features/quotation/api/quotationApi";
import { getPackageRatesPerCover } from "@/features/product_settings/api/benefitRangeApi";

export default {
  name: "QuotationBuilder",
  components: {
    Button,
    QuotaionInput,
    QuotationSelect,
  },
  props: {
    pending: { type: Boolean, default: false },
    hideFooterActions: { type: Boolean, default: false },
    pendingAction: { type: String, default: '' },
    quotations: Object,
    packages: { type: Array, required: true },
    onSubmit: { type: Function },
    prefill: { type: Array, required: false, default: undefined },
    showHeaderControls: { type: Boolean, default: true },
    readOnlyRows: { type: Boolean, default: false },
    acceptMode: { type: Boolean, default: false },
    issueMode: { type: Boolean, default: false },
    acceptLabel: { type: String, default: "Accept" },
    quotationUuid: { type: String, default: "" },
    viewIssued: { type: Object, default: () => ({}) },
    viewAccepted: { type: Object, default: () => ({}) },
    viewSaved: { type: Object, default: () => ({}) },
    viewAcccepted: { type: Object, default: () => ({}) },
    showIssuePremiumAdvice: { type: Boolean, default: false },
    showAmendButton: { type: Boolean, default: false },
  },
  emits: ["amend", "submit"],
  data() {
    return {
      selectedPackages: [],
      expandedPackageUuid: null,
      packageServicesMap: {},
      packageRatesCache: {},
      loadingRates: {},
      editPackages: true,
      Plan,
      lastUsedValues: {
        numberOfInsured: "",
        description: "",
        planType: null,
      },
    };
  },
  computed: {
    allPackages() {
      return this.packages;
    },
    formIsValid() {
      const selected = Array.isArray(this.selectedPackages)
        ? this.selectedPackages.filter(Boolean)
        : [];
      if (!selected.length) return false;

      for (const packageUuid of selected) {
        const services = this.packageServicesMap?.[packageUuid] || [];
        if (!Array.isArray(services) || services.length === 0) return false;

        for (const s of services) {
          if (!this.isServiceValid(s, packageUuid)) return false;
        }
      }

      return true;
    },
  },
  watch: {
    prefill: {
      handler(newVal) {
        if (newVal && Array.isArray(newVal) && newVal.length) {
          this.initializeFromPrefill(newVal);
        }
      },
      immediate: true,
      deep: true,
    },
  },
  methods: {
    normalizePlanTypeFromPrefill(planType) {
      const v = this.normalizeValue(planType);
      if (
        v === Plan["Individual Plan"] ||
        v === Plan["Dependent Shared Plan"] ||
        v === Plan["Family Shared Plan"]
      ) {
        return v;
      }

      if (typeof v === "string") {
        if (v === "Individual Plan") return Plan["Individual Plan"];
        if (v === "Dependent Shared Plan") return Plan["Dependent Shared Plan"];
        if (v === "Family Shared Plan") return Plan["Family Shared Plan"];
        if (v.includes("_")) return this.mapPlanTypeToEnum(v);
      }

      return v;
    },
    formatCurrency,
    formatNumber,

    formatRate(rate) {
      if (!rate && rate !== 0) return "0.0000";
      return Number(rate).toFixed(4);
    },

    isServiceValid(service, packageUuid) {
      if (!service) return false;
      const planType = this.normalizeValue(service.planType);
      const description = this.normalizeValue(service.description);

      const insured = Number(this.normalizeValue(service.numberOfInsured));
      if (!Number.isFinite(insured) || insured <= 0) return false;

      if (!planType) return false;
      if (description === "" || description == null) return false;

      const coverage = Number(this.normalizeValue(service.coverage));
      if (!Number.isFinite(coverage) || coverage <= 0) return false;

      const min = Number(this.getPackageMinLimit(packageUuid)) || 0;
      const max = Number(this.getPackageMaxLimit(packageUuid)) || 0;
      if ((min > 0 || max > 0) && (coverage < min || coverage > max)) return false;

      const rate = Number(this.normalizeValue(service.rate));
      if (!Number.isFinite(rate) || rate <= 0) return false;

      return true;
    },

    submitAction(action) {
      if (!this.formIsValid) return;
      this.$emit("submit", { action, data: this.buildPayload() });
    },

    async ensureRatesLoaded(packageUuid) {
      if (!packageUuid) return;
      if (this.packageRatesCache[packageUuid]) return;

      this.loadingRates = { ...this.loadingRates, [packageUuid]: true };

      try {
        const res = await getPackageRatesPerCover(packageUuid);
        const data = res?.data || res || [];
        this.packageRatesCache = {
          ...this.packageRatesCache,
          [packageUuid]: Array.isArray(data) ? data : [],
        };
      } catch (e) {
        console.error("Failed to load package rates:", e);
        this.packageRatesCache = {
          ...this.packageRatesCache,
          [packageUuid]: [],
        };
      } finally {
        this.loadingRates = { ...this.loadingRates, [packageUuid]: false };
      }
    },

    getRatesForPackage(packageUuid) {
      return this.packageRatesCache[packageUuid] || [];
    },

    getPackageName(packageUuid) {
      const pkg = this.packages.find((p) => p.packageUuid === packageUuid);
      return pkg?.packageName || "";
    },

    getPackageMinLimit(packageUuid) {
      const pkg = this.packages.find((p) => p.packageUuid === packageUuid);
      const pkgMin =
        Number(
          pkg?.minLimit ??
            pkg?.min_limit ??
            pkg?.minimumLimit ??
            pkg?.minimum_limit ??
            pkg?.minCoverage ??
            pkg?.min_coverage ??
            0
        ) || 0;

      if (pkgMin > 0) return pkgMin;

      const rates = this.getRatesForPackage(packageUuid);
      if (rates.length > 0) {
        const mins = rates.map((r) => r.minLimit).filter((v) => v != null);
        return mins.length ? Math.min(...mins) : 0;
      }

      return 0;
    },

    getPackageMaxLimit(packageUuid) {
      const pkg = this.packages.find((p) => p.packageUuid === packageUuid);
      const pkgMax =
        Number(
          pkg?.maxLimit ??
            pkg?.max_limit ??
            pkg?.maximumLimit ??
            pkg?.maximum_limit ??
            pkg?.maxCoverage ??
            pkg?.max_coverage ??
            0
        ) || 0;

      if (pkgMax > 0) return pkgMax;

      const rates = this.getRatesForPackage(packageUuid);
      if (rates.length > 0) {
        const maxs = rates.map((r) => r.maxLimit).filter((v) => v != null);
        return maxs.length ? Math.max(...maxs) : 0;
      }

      return 0;
    },

    isPackageSelected(packageUuid) {
      return this.selectedPackages.includes(packageUuid);
    },

    async togglePackageSelection(packageUuid) {
      if (this.isPackageSelected(packageUuid)) {
        this.deselectPackage(packageUuid);
        return;
      }

      await this.selectPackage(packageUuid);
    },

    async selectPackage(packageUuid) {
      await this.ensureRatesLoaded(packageUuid);

      // Keep most recently selected at the top
      this.selectedPackages = [
        packageUuid,
        ...(this.selectedPackages || []).filter((id) => id !== packageUuid),
      ];
      
      if (!this.packageServicesMap[packageUuid]) {
        this.initializePackageServices(packageUuid);
      }

      if (!this.expandedPackageUuid) {
        this.expandedPackageUuid = packageUuid;
      }
    },

    deselectPackage(packageUuid) {
      this.selectedPackages = this.selectedPackages.filter((id) => id !== packageUuid);

      if (this.expandedPackageUuid === packageUuid) {
        this.expandedPackageUuid = this.selectedPackages[0] || null;
      }
    },

    initializePackageServices(packageUuid) {
      const rates = this.getRatesForPackage(packageUuid);
      const planTypes = [...new Set(rates.map((r) => r.planType))];
      const defaultPlanType = planTypes[0] || "Individual_Plan";

      const selectedTemplateUuid = this.selectedPackages.find(
        (id) => id !== packageUuid && (this.packageServicesMap?.[id] || []).length
      );
      const templateServices = selectedTemplateUuid
        ? this.packageServicesMap[selectedTemplateUuid] || []
        : [];

      const canUseTemplate = templateServices.length > 0;
      const nextServices = [];

      const pushIfSupported = (candidate) => {
        const planApi = this.mapPlanTypeToApi(candidate.planType);
        const descVal = this.normalizeValue(candidate.description);
        const familySize = Number(descVal);

        const hasPlan = rates.some((r) => String(r?.planType) === String(planApi));
        if (!hasPlan) return;

        if (Number.isFinite(familySize) && familySize > 0) {
          const hasFamilySize = rates.some(
            (r) => String(r?.planType) === String(planApi) && Number(r?.familySize) === familySize
          );
          if (!hasFamilySize) return;
        }

        nextServices.push(candidate);
      };

      if (canUseTemplate) {
        templateServices.forEach((s) => {
          const planType =
            this.normalizeValue(s?.planType) || this.mapPlanTypeToEnum(defaultPlanType);
          const desc = this.normalizeValue(s?.description);
          pushIfSupported({
            packageUuid,
            serviceQuotedUuid: genId.next().value,
            numberOfInsured:
              this.normalizeValue(s?.numberOfInsured) || this.lastUsedValues.numberOfInsured || "",
            description: desc ?? "",
            rate: 0,
            premium: 0,
            sumInsured: 0,
            coverage: "",
            planType,
            individualType: "NA",
            spouse: false,
          });
        });
      }

      if (!nextServices.length) {
        let initialService = {
          packageUuid,
          serviceQuotedUuid: genId.next().value,
          numberOfInsured: this.lastUsedValues.numberOfInsured || "",
          description: "",
          rate: 0,
          premium: 0,
          sumInsured: 0,
          coverage: "",
          planType: this.mapPlanTypeToEnum(defaultPlanType),
          individualType: defaultPlanType === "Individual_Plan" ? "Member" : "NA",
          spouse: false,
        };

        if (this.lastUsedValues.planType) {
          const lastPlanApi = this.mapPlanTypeToApi(this.lastUsedValues.planType);
          if (planTypes.includes(lastPlanApi)) {
            initialService.planType = this.lastUsedValues.planType;
          }
        }

        nextServices.push(initialService);
      }

      this.packageServicesMap = {
        ...this.packageServicesMap,
        [packageUuid]: nextServices,
      };

      this.$nextTick(() => {
        nextServices.forEach((s) => {
          if (s.description) {
            this.handleDescriptionChange(s, packageUuid);
          }
        });
      });
    },

    initializeFromPrefill(prefillData) {
      const resolvePackageUuid = (quote) => {
        if (quote?.packageUuid) return quote.packageUuid;
        const first = Array.isArray(quote?.services) ? quote.services[0] : undefined;
        return first?.packageUuid;
      };

      const incoming = Array.isArray(prefillData) ? prefillData : [];
      const mergedByPackage = new Map();

      incoming.forEach((q) => {
        const packageUuid = resolvePackageUuid(q);
        if (!packageUuid) return;

        const list = Array.isArray(q?.services) ? q.services : [];
        const normalizedServices = list.map((s) => ({
          ...s,
          packageUuid: packageUuid,
          serviceQuotedUuid: s?.serviceQuotedUuid || genId.next().value,
          planType: this.normalizePlanTypeFromPrefill(s?.planType),
        }));

        const prev = mergedByPackage.get(packageUuid) || [];
        mergedByPackage.set(packageUuid, [...prev, ...normalizedServices]);
      });

      this.selectedPackages = Array.from(mergedByPackage.keys());

      const servicesMap = {};
      this.selectedPackages.forEach((packageUuid) => {
        const list = mergedByPackage.get(packageUuid) || [];
        servicesMap[packageUuid] = list;

        if (list.length > 0) {
          const firstService = list[0];
          this.lastUsedValues = {
            numberOfInsured: firstService.numberOfInsured,
            description: firstService.description,
            planType: firstService.planType,
          };
        }

        this.ensureRatesLoaded(packageUuid);
      });

      this.packageServicesMap = servicesMap;

      if (!this.expandedPackageUuid && this.selectedPackages.length) {
        this.expandedPackageUuid = this.selectedPackages[0];
      }
    },

    getPackageServices(packageUuid) {
      return this.packageServicesMap[packageUuid] || [];
    },

    mapPlanTypeToEnum(planType) {
      const mapping = {
        Individual_Plan: Plan["Individual Plan"],
        Dependent_Shared_Plan: Plan["Dependent Shared Plan"],
        Family_Shared_Plan: Plan["Family Shared Plan"],
      };
      return mapping[planType] || planType;
    },

    mapPlanTypeToApi(planType) {
      const normalized = this.normalizeValue(planType);
      const mapping = {
        [Plan["Individual Plan"]]: "Individual_Plan",
        [Plan["Dependent Shared Plan"]]: "Dependent_Shared_Plan",
        [Plan["Family Shared Plan"]]: "Family_Shared_Plan",
      };
      return mapping[normalized] || normalized;
    },

    normalizeValue(val) {
      if (typeof val === "object" && val !== null) {
        return val.value ?? val.id ?? val.label ?? val;
      }
      return val;
    },

    getPlanOptionsForPackage(packageUuid, currentIndex = -1) {
      const rates = this.getRatesForPackage(packageUuid);
      const pkg = this.packages.find((p) => p.packageUuid === packageUuid);

      if (pkg && isFemaleOnlyPackage(this.packages, pkg.packageName)) {
        return [{ label: "Individual Plan", value: Plan["Individual Plan"] }];
      }

      const services = this.packageServicesMap?.[packageUuid] || [];
      const taken = new Set(
        services
          .filter((s, idx) => idx !== currentIndex)
          .map((s) => this.normalizeValue(s?.planType))
          .filter((v) => v !== "undefined" && v !== "null" && v !== "")
      );

      const base = (() => {
        if (rates.length === 0) {
          return [
            { label: "Individual Plan", value: Plan["Individual Plan"] },
            { label: "Dependent Shared Plan", value: Plan["Dependent Shared Plan"] },
            { label: "Family Shared Plan", value: Plan["Family Shared Plan"] },
          ];
        }

        const uniquePlanTypes = [...new Set(rates.map((r) => r.planType))];
        return uniquePlanTypes.map((pt) => ({
          label: this.formatPlanTypeLabel(pt),
          value: this.mapPlanTypeToEnum(pt),
        }));
      })();

      if (taken.has(Plan["Individual Plan"])) {
        const current = services?.[currentIndex]?.planType;
        const currentNorm = this.normalizeValue(current);
        return base.filter((opt) => {
          if (this.normalizeValue(opt?.value) !== Plan["Individual Plan"]) return true;
          return currentNorm === Plan["Individual Plan"];
        });
      }

      return base;
    },

    formatPlanTypeLabel(planType) {
      const labels = {
        Individual_Plan: "Individual Plan",
        Dependent_Shared_Plan: "Dependent Shared Plan",
        Family_Shared_Plan: "Family Shared Plan",
      };
      return labels[planType] || String(planType).replace(/_/g, " ");
    },

    getDescriptionOptions(packageUuid, planType, currentIndex) {
      const baseOptions = (() => {
        const rates = this.getRatesForPackage(packageUuid);
        const effectivePlan = this.normalizeValue(planType);
        const apiPlanType = this.mapPlanTypeToApi(effectivePlan);
        const pkg = this.packages.find((p) => p.packageUuid === packageUuid);

        if (effectivePlan === Plan["Individual Plan"]) {
          return allMemberTYpes;
        }

        if (rates.length === 0) {
          return getFamilyTypes(this.packages, pkg?.packageName, effectivePlan);
        }

        const planRates = rates.filter((r) => r.planType === apiPlanType);

        if (planRates.length === 0) {
          return getFamilyTypes(this.packages, pkg?.packageName, effectivePlan);
        }

        const familySizes = [...new Set(planRates.map((r) => r.familySize))].sort(
          (a, b) => a - b
        );

        return familySizes.map((size) => {
          const found = allMemberTYpes.find((opt) => Number(opt.value) === Number(size));
          return found || { label: `Family Size ${size}`, value: size };
        });
      })();

      const effectivePlan = this.normalizeValue(planType);
      if (effectivePlan === Plan["Individual Plan"]) {
        return baseOptions;
      }

      const services = this.packageServicesMap?.[packageUuid] || [];
      const taken = new Set(
        services
          .filter((s, idx) => idx !== currentIndex)
          .filter((s) => this.normalizeValue(s?.planType) === effectivePlan)
          .map((s) => String(this.normalizeValue(s?.description)))
          .filter((v) => v !== "undefined" && v !== "null" && v !== "")
      );

      return baseOptions.filter((opt) => !taken.has(String(this.normalizeValue(opt?.value))));
    },

    getRatesForService(service, packageUuid) {
      const rates = this.getRatesForPackage(packageUuid);
      const planType = this.normalizeValue(service.planType);
      const apiPlanType = this.mapPlanTypeToApi(planType);
      const description = this.normalizeValue(service.description);
      const familySize =
        planType === Plan["Individual Plan"] ? 1 : Number(description) || 1;

      return rates.filter(
        (r) => r.planType === apiPlanType && Number(r.familySize) === familySize
      );
    },

    getRangeDisplayForService(service, packageUuid) {
      const min = Number(this.getPackageMinLimit(packageUuid)) || 0;
      const max = Number(this.getPackageMaxLimit(packageUuid)) || 0;
      return `${formatNumber(min)} - ${formatNumber(max)}`;
    },

    getCoverageValidationForService(service, packageUuid) {
      const min = Number(this.getPackageMinLimit(packageUuid)) || 0;
      const max = Number(this.getPackageMaxLimit(packageUuid)) || 0;

      const base = { required: true, num: true };

      if (min > 0 || max > 0) {
        return {
          ...base,
          num_minmax: {
            args: [min, max],
            message: `${formatNumber(min)} - ${formatNumber(max)}`,
          },
        };
      }

      return base;
    },

    handlePlanTypeChange(service, packageUuid) {
      service.description = "";
      service.rate = 0;
      this.lastUsedValues.planType = service.planType;
    },

    setRateFromCache(service, packageUuid) {
      const list = this.getRatesForService(service, packageUuid);
      if (Array.isArray(list) && list.length > 0) {
        const rate = list[0]?.rate;
        service.rate = Number(rate) || 0;
        return true;
      }
      service.rate = 0;
      return false;
    },

    async handleDescriptionChange(service, packageUuid) {
      try {
        const planType = this.normalizeValue(service.planType);
        const description = this.normalizeValue(service.description);

        const resolved = this.setRateFromCache(service, packageUuid);

        if (!resolved && (this.getRatesForPackage(packageUuid) || []).length === 0) {
          const apiPlanType = this.mapPlanTypeToApi(planType);

          let familySize = 1;
          if (
            planType === Plan["Dependent Shared Plan"] ||
            planType === Plan["Family Shared Plan"]
          ) {
            familySize = Number(description) || 1;
          }

          const resp = await getPackageRate({
            packageUuid: service.packageUuid || packageUuid,
            planType: apiPlanType,
            familySize,
          });

          const rate = resp?.data?.rate || resp?.rate || 0;
          service.rate = Number(rate) || 0;
        }

        this.lastUsedValues.description = service.description;
        this.updatePremium(service, packageUuid);
      } catch (e) {
        console.error("Failed to fetch rate:", e);
        service.rate = 0;
      }
    },

    calculateTotalSumInsured(service) {
      const coverage = Number(service.coverage) || 0;
      const insured = Number(service.numberOfInsured) || 0;
      const planType = this.normalizeValue(service.planType);

      let sum = coverage * insured;

      if (planType === Plan["Family Shared Plan"] || planType === Plan["Individual Plan"]) {
        const description = this.normalizeValue(service.description);
        const multiplier = Number(description) || 1;
        sum = sum * multiplier;
      }

      service.sumInsured = sum;
      return sum;
    },

    calculatePremium(service) {
      const sumInsured = this.calculateTotalSumInsured(service);
      const rate = Number(service.rate) || 0;
      const premium = sumInsured * rate;
      service.premium = premium;
      return premium;
    },

    updatePremium(service, packageUuid) {
      this.calculatePremium(service);
    },

    updateLastUsedValues(service) {
      if (service.numberOfInsured) {
        this.lastUsedValues.numberOfInsured = service.numberOfInsured;
      }
    },

    addServiceToPackage(packageUuid) {
      const services = this.packageServicesMap[packageUuid] || [];
      const firstService = services[0] || {};
      const rates = this.getRatesForPackage(packageUuid);
      const planTypes = [...new Set(rates.map((r) => r.planType))];
      const defaultPlanType = planTypes[0] || "Individual_Plan";

      const rawDesiredPlanType =
        firstService.planType || this.mapPlanTypeToEnum(defaultPlanType);
      const desiredPlanType = (() => {
        const hasIndividual = services.some(
          (s) => this.normalizeValue(s?.planType) === Plan["Individual Plan"]
        );
        if (!hasIndividual) return rawDesiredPlanType;
        if (this.normalizeValue(rawDesiredPlanType) !== Plan["Individual Plan"]) return rawDesiredPlanType;

        const options = this.getPlanOptionsForPackage(packageUuid, services.length);
        const firstNonIndividual = (options || []).find(
          (o) => this.normalizeValue(o?.value) !== Plan["Individual Plan"]
        );
        return firstNonIndividual?.value || rawDesiredPlanType;
      })();

      const newRow = {
        packageUuid,
        serviceQuotedUuid: genId.next().value,
        numberOfInsured:
          this.lastUsedValues.numberOfInsured || firstService.numberOfInsured || "",
        description: "",
        rate: 0,
        premium: 0,
        sumInsured: 0,
        coverage: "",
        planType: desiredPlanType,
        individualType: defaultPlanType === "Individual_Plan" ? "Member" : "NA",
        spouse: false,
      };

      services.push(newRow);

      this.packageServicesMap = {
        ...this.packageServicesMap,
        [packageUuid]: services,
      };

      this.selectedPackages
        .filter((id) => id !== packageUuid)
        .forEach((otherUuid) => {
          const otherRates = this.getRatesForPackage(otherUuid);
          const otherServices = this.packageServicesMap?.[otherUuid] || [];
          if (!Array.isArray(otherServices) || !otherServices.length) return;

          const desiredPlanApi = this.mapPlanTypeToApi(desiredPlanType);
          const planSupported = otherRates.some(
            (r) => String(r?.planType) === String(desiredPlanApi)
          );
          const otherPlanType = planSupported
            ? desiredPlanType
            : otherServices?.[0]?.planType ||
              this.mapPlanTypeToEnum(
                new Set(otherRates.map((r) => r.planType)).values().next().value || "Individual_Plan"
              );

          otherServices.push({
            packageUuid: otherUuid,
            serviceQuotedUuid: genId.next().value,
            numberOfInsured: newRow.numberOfInsured,
            description: "",
            rate: 0,
            premium: 0,
            sumInsured: 0,
            coverage: "",
            planType: otherPlanType,
            individualType: "NA",
            spouse: false,
          });

          this.packageServicesMap = {
            ...this.packageServicesMap,
            [otherUuid]: otherServices,
          };
        });
    },

    removeServiceFromPackage(packageUuid, serviceIndex) {
      const services = this.packageServicesMap[packageUuid] || [];
      if (services.length > 1) {
        services.splice(serviceIndex, 1);
        this.packageServicesMap = {
          ...this.packageServicesMap,
          [packageUuid]: services,
        };
      }
    },

    duplicateServiceInPackage(packageUuid, service) {
      const services = this.packageServicesMap[packageUuid] || [];
      services.unshift({
        ...service,
        serviceQuotedUuid: genId.next().value,
      });

      this.packageServicesMap = {
        ...this.packageServicesMap,
        [packageUuid]: services,
      };
    },

    buildPayload() {
      const norm = (v) =>
        typeof v === "object" && v !== null ? v.value ?? v.id ?? v.label ?? v : v;

      const quotations = (this.selectedPackages || [])
        .filter(Boolean)
        .map((packageUuid) => {
          const pkg = this.packages.find((p) => p.packageUuid === packageUuid);
          const services = this.packageServicesMap[packageUuid] || [];

          return {
            packageUuid,
            packageName: pkg?.packageName || "",
            planType: services[0]?.planType || "",
            services: services.map((s) => {
              const planType = norm(s.planType);
              const description = norm(s.description);

              let individualType = s.individualType;
              if (planType === Plan["Individual Plan"]) {
                const desc = String(description || "").trim();
                if (["Member", "Spouse", "Children"].includes(desc)) {
                  individualType = desc;
                } else {
                  individualType = "Member";
                }
              } else {
                individualType = "NA";
              }

              return {
                ...s,
                planType,
                description,
                individualType,
                numberOfInsured: Number(s.numberOfInsured) || 0,
                coverage: Number(s.coverage) || 0,
                rate: Number(s.rate) || 0,
                premium: Number(s.premium) || 0,
                sumInsured: Number(s.sumInsured) || 0,
              };
            }),
          };
        });

      const payload = { quotations };
      if (this.quotationUuid) {
        payload.quotationUuid = this.quotationUuid;
      }

      return payload;
    },
  },
};
</script>

<style scoped>
.quotation-builder {
  @apply max-w-6xl mx-auto;
}

/* Smooth transitions */
.transition-all {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Custom scrollbar for tables */
@media (min-width: 1024px) {
  .space-y-3::-webkit-scrollbar {
    width: 6px;
  }
  
  .space-y-3::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  .space-y-3::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .space-y-3::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
}

/* Pulse animation for loading */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>