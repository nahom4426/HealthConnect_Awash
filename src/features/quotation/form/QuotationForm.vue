<template>
  <div class="quotation-builder">
    <!-- Package Selection Cards -->
    <div v-if="showHeaderControls" class="mb-6">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-slate-800">Available Coverages</h3>
        <p class="mt-1 text-sm text-slate-500">Select coverage types to add to your quotation</p>
      </div>

      <!-- Package Cards Grid - Selection Only -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="pkg in allPackages"
          :key="pkg.packageUuid"
          @click="togglePackageSelection(pkg.packageUuid)"
          class="relative p-5 bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer group"
          :class="[
            isPackageSelected(pkg.packageUuid)
              ? 'border-blue-500 bg-blue-50/30 shadow-md'
              : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
          ]"
        >
          <!-- Package Info -->
          <div>
            <h4 class="mb-1 text-base font-semibold text-slate-900">{{ pkg.packageName }}</h4>
            <span class="inline-block px-2 py-0.5 text-xs font-medium rounded text-slate-600 bg-slate-100">
              {{ pkg.packageCategory }}
            </span>
          </div>

          <!-- Package Limits Summary -->
          <div class="mt-4 space-y-2">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">Min Limit:</span>
              <span class="font-medium text-slate-700">{{ formatCurrency(getPackageMinLimit(pkg.packageUuid)) }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">Max Limit:</span>
              <span class="font-medium text-slate-700">{{ formatCurrency(getPackageMaxLimit(pkg.packageUuid)) }}</span>
            </div>
          </div>

          <!-- Gender Badge -->
          <div v-if="pkg.gender" class="mt-3">
            <span
              class="inline-flex items-center px-2 py-1 text-xs font-medium rounded"
              :class="pkg.gender === 'FEMALE' ? 'bg-pink-50 text-pink-700' : 'bg-slate-100 text-slate-700'"
            >
              {{ pkg.gender === 'FEMALE' ? 'Female Only' : 'All Genders' }}
            </span>
          </div>

          <!-- Loading Indicator -->
          <div v-if="loadingRates[pkg.packageUuid]" class="mt-3">
            <div class="flex gap-2 items-center text-xs text-slate-500">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <span>Loading rates...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Packages Tables -->
    <div v-if="selectedPackages.length > 0" class="space-y-6">
      <div
        v-for="packageUuid in selectedPackages"
        :key="packageUuid"
        class="overflow-hidden bg-white rounded-xl border shadow-sm border-slate-200"
        v-show="!showHeaderControls || expandedPackageUuid === packageUuid"
      >
        <!-- Package Header -->
        <div class="px-6 py-4 bg-gradient-to-r to-white border-b from-slate-50 border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
              <div>
                <h4 class="text-lg font-semibold text-slate-900">{{ getPackageName(packageUuid) }}</h4>
                <div class="flex gap-2 items-center mt-1">
                  <span class="text-xs text-slate-500">Package ID:</span>
                  <span class="font-mono text-xs text-slate-600">{{ packageUuid?.slice(0, 8) }}...</span>
                </div>
              </div>
            </div>
            <Button
              v-if="!readOnlyRows"
              @click.prevent="deselectPackage(packageUuid)"
              class="!px-3 !py-1.5 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
            >
              Remove
            </Button>
          </div>
        </div>

        <!-- Services Table -->
        <div class="p-6">
          <!-- Table Header -->
          <div class="grid grid-cols-12 gap-4 px-4 py-3 mb-3 text-xs font-semibold tracking-wide uppercase rounded-lg bg-slate-50 text-slate-600">
            <div class="col-span-2">Insured</div>
            <div class="col-span-2">Plan Type</div>
            <div class="col-span-2">Description</div>
            <div class="col-span-2">Sum Insured</div>
            <div class="col-span-1">Rate</div>
            <div class="col-span-2">Premium</div>
            <div class="col-span-1 text-right">Action</div>
          </div>

          <!-- Services Rows -->
          <div class="space-y-3">
            <div
              v-for="(service, serviceIndex) in getPackageServices(packageUuid)"
              :key="`service-${serviceIndex}`"
              class="grid grid-cols-12 gap-4 items-start px-4 py-4 bg-white rounded-lg border transition-colors border-slate-100 hover:bg-slate-50/50"
            >
              <!-- Number of Insured -->
              <div class="col-span-2">
                <QuotaionInput
                  v-model="service.numberOfInsured"
                  validation="required|num"
                  name="numberOfInsured"
                  @update:modelValue="() => updateLastUsedValues(service)"
                  :attributes="{
                    placeholder: '0',
                    class: '!h-10 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-center'
                  }"
                />
              </div>

              <!-- Plan Type -->
              <div class="col-span-2">
                <QuotationSelect
                  :obj="true"
                  v-model="service.planType"
                  validation="required"
                  name="rowPlanType"
                  :options="getPlanOptionsForPackage(packageUuid)"
                  @update:modelValue="() => handlePlanTypeChange(service, packageUuid)"
                  :attributes="{
                    placeholder: 'Select plan',
                    class: '!h-10 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm'
                  }"
                />
              </div>

              <!-- Description -->
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
                    class: '!h-10 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm'
                  }"
                />
              </div>

              <!-- Sum Insured & Total -->
              <div class="col-span-2 space-y-1.5">
                <QuotaionInput
                  v-model="service.coverage"
                  :validation="getCoverageValidationForService(service, packageUuid)"
                  name="coverage"
                  @update:modelValue="() => updatePremium(service, packageUuid)"
                  :attributes="{
                    placeholder: 'Amount',
                    class: '!h-10 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-right'
                  }"
                />
                <div class="text-xs text-right">
                  <span class="text-slate-500">Range: </span>
                  <span class="font-medium text-slate-700">{{ getRangeDisplayForService(service, packageUuid) }}</span>
                </div>
                <div class="text-xs text-right">
                  <span class="text-slate-500">Total: </span>
                  <span class="font-semibold text-blue-600">{{ formatCurrency(calculateTotalSumInsured(service)) }}</span>
                </div>
              </div>

              <!-- Rate -->
              <div class="col-span-1">
                <QuotaionInput
                  :value="formatRate(service.rate)"
                  name="rate"
                  :attributes="{
                    disabled: true,
                    class: '!h-10 !rounded-lg border-slate-200 bg-slate-50 text-sm text-right font-medium text-blue-600'
                  }"
                />
              </div>

              <!-- Premium -->
              <div class="col-span-2">
                <QuotaionInput
                  :value="formatCurrency(calculatePremium(service))"
                  name="premium"
                  :attributes="{
                    disabled: true,
                    class: '!h-10 !rounded-lg border-slate-200 bg-emerald-50 text-sm text-right font-semibold text-emerald-700'
                  }"
                />
              </div>

              <!-- Actions -->
              <div class="flex col-span-1 gap-2 justify-end items-center">
                <button
                  v-if="!readOnlyRows && getPackageServices(packageUuid).length > 1"
                  @click.prevent="removeServiceFromPackage(packageUuid, serviceIndex)"
                  class="flex justify-center items-center w-8 h-8 text-red-600 bg-red-50 rounded-lg border border-red-200 transition-colors hover:bg-red-100"
                  title="Remove row"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                  </svg>
                </button>
                <button
                  v-if="!issueMode && !showIssuePremiumAdvice && !readOnlyRows"
                  @click.prevent="duplicateServiceInPackage(packageUuid, service)"
                  class="flex justify-center items-center w-8 h-8 text-blue-600 bg-blue-50 rounded-lg border border-blue-200 transition-colors hover:bg-blue-100"
                  title="Duplicate row"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Add Row Button -->
          <div v-if="!readOnlyRows" class="pt-4 mt-4 border-t border-slate-200">
            <button
              @click.prevent="addServiceToPackage(packageUuid)"
              class="flex gap-2 items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg border border-blue-200 transition-colors hover:bg-blue-100"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Row
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="selectedPackages.length === 0 && showHeaderControls"
      class="flex flex-col items-center py-16 rounded-xl border-2 border-dashed bg-slate-50 border-slate-300"
    >
      <div class="mb-4 text-slate-400">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p class="text-base font-medium text-slate-600">No Coverage Selected</p>
      <p class="mt-1 text-sm text-slate-500">Select coverage types above to get started</p>
    </div>

    <!-- Footer Actions -->
    <div v-if="selectedPackages.length > 0" class="pt-6 mt-8 border-t border-slate-200">
      <div class="flex justify-between items-center">
        <div class="text-sm text-slate-500">
          Selected Packages: <span class="font-medium text-slate-700">{{ selectedPackages.length }}</span>
        </div>
        
        <div class="flex gap-3">
          <div v-if="showAmendButton">
            <Button 
              type="secondary" 
              @click="$emit('amend')"
              class="px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-300 hover:border-slate-400"
            >
              Amend
            </Button>
          </div>
          
          <template v-if="showIssuePremiumAdvice">
            <Button 
              type="primary" 
              @click="$emit('submit', { action: 'issuePremiumAdvice', data: buildPayload() })"
              class="px-5 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 shadow-purple-500/20"
            >
              Issue Premium Advice
            </Button>
          </template>
          
          <template v-else-if="issueMode">
            <Button 
              type="primary" 
              @click="$emit('submit', { action: 'accept', data: buildPayload() })"
              class="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 shadow-green-500/20"
            >
              {{ acceptLabel }}
            </Button>
          </template>
          
          <template v-else-if="!acceptMode">
            <Button 
              @click.prevent="saveQuotation"
              class="px-5 py-2.5 text-sm font-medium bg-white rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50"
            >
              Save Draft
            </Button>
            
            <Button 
              @click.prevent="issueQuotation"
              class="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg shadow-md transition-all duration-200 shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
            >
              Issue Quotation
            </Button>
          </template>
          
          <template v-else>
            <Button 
              @click.prevent="saveSavedQuotation"
              class="px-5 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-300 hover:bg-blue-100"
            >
              Save Changes
            </Button>
            
            <Button 
              @click.prevent="issueSavedQuotation"
              class="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg shadow-md shadow-emerald-500/20"
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
    quotations: Object,
    packages: { type: Array, required: true },
    onSubmit: { type: Function },
    prefill: { type: Array, required: false, default: undefined },
    showHeaderControls: { type: Boolean, default: true },
    readOnlyRows: { type: Boolean, default: false },
    acceptMode: { type: Boolean, default: false },
    issueMode: { type: Boolean, default: false },
    acceptLabel: { type: String, default: 'Accept' },
    quotationUuid: { type: String, default: '' },
    viewIssued: { type: Object, default: () => ({}) },
    viewAccepted: { type: Object, default: () => ({}) },
    viewSaved: { type: Object, default: () => ({}) },
    viewAcccepted: { type: Object, default: () => ({}) },
    showIssuePremiumAdvice: { type: Boolean, default: false },
    showAmendButton: { type: Boolean, default: false },
  },
  emits: ['amend', 'submit'],
  data() {
    return {
      selectedPackages: [],
      expandedPackageUuid: null,
      packageServicesMap: {},
      packageRatesCache: {},
      loadingRates: {},
      Plan,
      lastUsedValues: {
        numberOfInsured: '',
        description: '',
        planType: null,
      },
    };
  },
  computed: {
    allPackages() {
      return this.packages;
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
    formatCurrency,
    formatNumber,
    
    formatRate(rate) {
      if (!rate && rate !== 0) return '0.0000';
      return Number(rate).toFixed(4);
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
          [packageUuid]: Array.isArray(data) ? data : []
        };
      } catch (e) {
        console.error('Failed to load package rates:', e);
        this.packageRatesCache = {
          ...this.packageRatesCache,
          [packageUuid]: []
        };
      } finally {
        this.loadingRates = { ...this.loadingRates, [packageUuid]: false };
      }
    },
    
    getRatesForPackage(packageUuid) {
      return this.packageRatesCache[packageUuid] || [];
    },
    
    getPackageName(packageUuid) {
      const pkg = this.packages.find(p => p.packageUuid === packageUuid);
      return pkg?.packageName || '';
    },
    
    getPackageMinLimit(packageUuid) {
      const rates = this.getRatesForPackage(packageUuid);
      if (rates.length > 0) {
        const mins = rates.map(r => r.minLimit).filter(v => v != null);
        return mins.length ? Math.min(...mins) : 0;
      }
      const pkg = this.packages.find(p => p.packageUuid === packageUuid);
      return pkg?.minLimit || 0;
    },
    
    getPackageMaxLimit(packageUuid) {
      const rates = this.getRatesForPackage(packageUuid);
      if (rates.length > 0) {
        const maxs = rates.map(r => r.maxLimit).filter(v => v != null);
        return maxs.length ? Math.max(...maxs) : 0;
      }
      const pkg = this.packages.find(p => p.packageUuid === packageUuid);
      return pkg?.maxLimit || 0;
    },
    
    isPackageSelected(packageUuid) {
      return this.selectedPackages.includes(packageUuid);
    },
    
    async togglePackageSelection(packageUuid) {
      if (this.isPackageSelected(packageUuid)) {
        if (this.expandedPackageUuid === packageUuid) {
          this.expandedPackageUuid = null;
        } else {
          this.expandedPackageUuid = packageUuid;
        }
        return;
      }

      await this.selectPackage(packageUuid);
      this.expandedPackageUuid = packageUuid;
    },
    
    async selectPackage(packageUuid) {
      await this.ensureRatesLoaded(packageUuid);
      
      if (!this.selectedPackages.includes(packageUuid)) {
        this.selectedPackages.push(packageUuid);
      }
      
      // Initialize services if not exists
      if (!this.packageServicesMap[packageUuid]) {
        this.initializePackageServices(packageUuid);
      }

      if (!this.expandedPackageUuid) {
        this.expandedPackageUuid = packageUuid;
      }
    },
    
    deselectPackage(packageUuid) {
      this.selectedPackages = this.selectedPackages.filter(id => id !== packageUuid);

      if (this.expandedPackageUuid === packageUuid) {
        this.expandedPackageUuid = this.selectedPackages[0] || null;
      }
    },
    
    initializePackageServices(packageUuid) {
      const rates = this.getRatesForPackage(packageUuid);
      const planTypes = [...new Set(rates.map(r => r.planType))];
      const defaultPlanType = planTypes[0] || 'Individual_Plan';
      
      const selectedTemplateUuid = this.selectedPackages.find((id) => id !== packageUuid && (this.packageServicesMap?.[id] || []).length);
      const templateServices = selectedTemplateUuid ? (this.packageServicesMap[selectedTemplateUuid] || []) : [];

      const canUseTemplate = templateServices.length > 0;
      const nextServices = [];

      const pushIfSupported = (candidate) => {
        const planApi = this.mapPlanTypeToApi(candidate.planType);
        const descVal = this.normalizeValue(candidate.description);
        const familySize = Number(descVal);

        const hasPlan = rates.some((r) => String(r?.planType) === String(planApi));
        if (!hasPlan) return;

        if (Number.isFinite(familySize) && familySize > 0) {
          const hasFamilySize = rates.some((r) => String(r?.planType) === String(planApi) && Number(r?.familySize) === familySize);
          if (!hasFamilySize) return;
        }

        nextServices.push(candidate);
      };

      if (canUseTemplate) {
        templateServices.forEach((s) => {
          const planType = this.normalizeValue(s?.planType) || this.mapPlanTypeToEnum(defaultPlanType);
          const desc = this.normalizeValue(s?.description);
          pushIfSupported({
            packageUuid,
            serviceQuotedUuid: genId.next().value,
            numberOfInsured: this.normalizeValue(s?.numberOfInsured) || this.lastUsedValues.numberOfInsured || '',
            description: desc ?? '',
            rate: 0,
            premium: 0,
            sumInsured: 0,
            coverage: '',
            planType,
            individualType: 'NA',
            spouse: false,
          });
        });
      }

      if (!nextServices.length) {
        let initialService = {
          packageUuid,
          serviceQuotedUuid: genId.next().value,
          numberOfInsured: this.lastUsedValues.numberOfInsured || '',
          description: '',
          rate: 0,
          premium: 0,
          sumInsured: 0,
          coverage: '',
          planType: this.mapPlanTypeToEnum(defaultPlanType),
          individualType: defaultPlanType === 'Individual_Plan' ? 'Member' : 'NA',
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

      const resolved = (Array.isArray(prefillData) ? prefillData : [])
        .map((q) => ({ quote: q, packageUuid: resolvePackageUuid(q) }))
        .filter((x) => !!x.packageUuid);

      this.selectedPackages = resolved.map((x) => x.packageUuid);

      const servicesMap = {};
      resolved.forEach(({ quote, packageUuid }) => {
        const list = Array.isArray(quote?.services) ? quote.services : [];
        servicesMap[packageUuid] = list.map((s) => ({
          ...s,
          packageUuid: packageUuid,
          serviceQuotedUuid: s?.serviceQuotedUuid || genId.next().value,
        }));

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
        'Individual_Plan': Plan['Individual Plan'],
        'Family_Plan': Plan['Family Plan'],
        'Family_Shared_Plan': Plan['Family Shared Plan'],
      };
      return mapping[planType] || planType;
    },
    
    mapPlanTypeToApi(planType) {
      const normalized = this.normalizeValue(planType);
      const mapping = {
        [Plan['Individual Plan']]: 'Individual_Plan',
        [Plan['Family Plan']]: 'Family_Plan',
        [Plan['Family Shared Plan']]: 'Family_Shared_Plan',
      };
      return mapping[normalized] || normalized;
    },
    
    normalizeValue(val) {
      if (typeof val === 'object' && val !== null) {
        return val.value ?? val.id ?? val.label ?? val;
      }
      return val;
    },
    
    getPlanOptionsForPackage(packageUuid) {
      const rates = this.getRatesForPackage(packageUuid);
      const pkg = this.packages.find(p => p.packageUuid === packageUuid);
      
      if (pkg && isFemaleOnlyPackage(this.packages, pkg.packageName)) {
        return [{ label: 'Individual Plan', value: Plan['Individual Plan'] }];
      }
      
      if (rates.length === 0) {
        return [
          { label: 'Individual Plan', value: Plan['Individual Plan'] },
          { label: 'Family Plan', value: Plan['Family Plan'] },
          { label: 'Dependent Shared Plan', value: Plan['Family Shared Plan'] },
        ];
      }
      
      const uniquePlanTypes = [...new Set(rates.map(r => r.planType))];
      return uniquePlanTypes.map(pt => ({
        label: this.formatPlanTypeLabel(pt),
        value: this.mapPlanTypeToEnum(pt),
      }));
    },
    
    formatPlanTypeLabel(planType) {
      const labels = {
        'Individual_Plan': 'Individual Plan',
        'Family_Plan': 'Family Plan',
        'Family_Shared_Plan': 'Dependent Shared Plan',
      };
      return labels[planType] || planType.replace(/_/g, ' ');
    },
    
    getDescriptionOptions(packageUuid, planType, currentIndex) {
      const baseOptions = (() => {
        const rates = this.getRatesForPackage(packageUuid);
        const effectivePlan = this.normalizeValue(planType);
        const apiPlanType = this.mapPlanTypeToApi(effectivePlan);
        const pkg = this.packages.find(p => p.packageUuid === packageUuid);

        if (rates.length === 0) {
          return getFamilyTypes(this.packages, pkg?.packageName, effectivePlan);
        }

        const planRates = rates.filter(r => r.planType === apiPlanType);

        if (planRates.length === 0) {
          return getFamilyTypes(this.packages, pkg?.packageName, effectivePlan);
        }

        const familySizes = [...new Set(planRates.map(r => r.familySize))].sort((a, b) => a - b);

        return familySizes.map(size => {
          const found = allMemberTYpes.find(opt => Number(opt.value) === Number(size));
          return found || { label: `Family Size ${size}`, value: size };
        });
      })();

      const services = this.packageServicesMap?.[packageUuid] || [];
      const effectivePlan = this.normalizeValue(planType);
      const taken = new Set(
        services
          .filter((s, idx) => idx !== currentIndex)
          .filter((s) => this.normalizeValue(s?.planType) === effectivePlan)
          .map((s) => String(this.normalizeValue(s?.description)))
          .filter((v) => v !== 'undefined' && v !== 'null' && v !== '')
      );

      return baseOptions.filter((opt) => !taken.has(String(this.normalizeValue(opt?.value))));
    },
    
    getRatesForService(service, packageUuid) {
      const rates = this.getRatesForPackage(packageUuid);
      const planType = this.normalizeValue(service.planType);
      const apiPlanType = this.mapPlanTypeToApi(planType);
      const description = this.normalizeValue(service.description);
      const familySize = Number(description) || 1;
      
      return rates.filter(r => 
        r.planType === apiPlanType && 
        Number(r.familySize) === familySize
      );
    },
    
    getRangeDisplayForService(service, packageUuid) {
      const serviceRates = this.getRatesForService(service, packageUuid);
      
      if (serviceRates.length > 0) {
        const mins = serviceRates.map(r => r.minLimit).filter(v => v != null);
        const maxs = serviceRates.map(r => r.maxLimit).filter(v => v != null);
        const min = mins.length ? Math.min(...mins) : 0;
        const max = maxs.length ? Math.max(...maxs) : 0;
        return `${formatNumber(min)} - ${formatNumber(max)}`;
      }
      
      return '0 - 0';
    },
    
    getCoverageValidationForService(service, packageUuid) {
      const serviceRates = this.getRatesForService(service, packageUuid);
      
      let min = 0;
      let max = 0;
      
      if (serviceRates.length > 0) {
        const mins = serviceRates.map(r => r.minLimit).filter(v => v != null);
        const maxs = serviceRates.map(r => r.maxLimit).filter(v => v != null);
        min = mins.length ? Math.min(...mins) : 0;
        max = maxs.length ? Math.max(...maxs) : 0;
      }
      
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
      service.description = '';
      service.rate = 0;
      this.lastUsedValues.planType = service.planType;
    },
    
    async handleDescriptionChange(service, packageUuid) {
      try {
        const planType = this.normalizeValue(service.planType);
        const description = this.normalizeValue(service.description);
        const apiPlanType = this.mapPlanTypeToApi(planType);
        
        let familySize = 1;
        if (planType === Plan['Family Plan'] || planType === Plan['Family Shared Plan']) {
          familySize = Number(description) || 1;
        }
        
        const resp = await getPackageRate({
          packageUuid: service.packageUuid || packageUuid,
          planType: apiPlanType,
          familySize,
        });
        
        const rate = resp?.data?.rate || resp?.rate || 0;
        service.rate = Number(rate) || 0;
        
        this.lastUsedValues.description = service.description;
        this.updatePremium(service, packageUuid);
      } catch (e) {
        console.error('Failed to fetch rate:', e);
        service.rate = 0;
      }
    },
    
    calculateTotalSumInsured(service) {
      const coverage = Number(service.coverage) || 0;
      const insured = Number(service.numberOfInsured) || 0;
      const planType = this.normalizeValue(service.planType);
      
      let sum = coverage * insured;
      
      if (planType === Plan['Family Shared Plan']) {
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
      const planTypes = [...new Set(rates.map(r => r.planType))];
      const defaultPlanType = planTypes[0] || 'Individual_Plan';

      const desiredPlanType = firstService.planType || this.mapPlanTypeToEnum(defaultPlanType);

      const newRow = {
        packageUuid,
        serviceQuotedUuid: genId.next().value,
        numberOfInsured: this.lastUsedValues.numberOfInsured || firstService.numberOfInsured || '',
        description: '',
        rate: 0,
        premium: 0,
        sumInsured: 0,
        coverage: '',
        planType: desiredPlanType,
        individualType: defaultPlanType === 'Individual_Plan' ? 'Member' : 'NA',
        spouse: false,
      };

      services.push(newRow);
      
      this.packageServicesMap = {
        ...this.packageServicesMap,
        [packageUuid]: services,
      };

      // Sync: add corresponding row to other selected packages (coverage stays empty)
      this.selectedPackages
        .filter((id) => id !== packageUuid)
        .forEach((otherUuid) => {
          const otherRates = this.getRatesForPackage(otherUuid);
          const otherServices = this.packageServicesMap?.[otherUuid] || [];
          if (!Array.isArray(otherServices) || !otherServices.length) return;

          const desiredPlanApi = this.mapPlanTypeToApi(desiredPlanType);
          const planSupported = otherRates.some((r) => String(r?.planType) === String(desiredPlanApi));
          const otherPlanType = planSupported
            ? desiredPlanType
            : (otherServices?.[0]?.planType || this.mapPlanTypeToEnum((new Set(otherRates.map(r => r.planType))).values().next().value || 'Individual_Plan'));

          otherServices.push({
            packageUuid: otherUuid,
            serviceQuotedUuid: genId.next().value,
            numberOfInsured: newRow.numberOfInsured,
            description: '',
            rate: 0,
            premium: 0,
            sumInsured: 0,
            coverage: '',
            planType: otherPlanType,
            individualType: 'NA',
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
        (typeof v === 'object' && v !== null) ? (v.value ?? v.id ?? v.label ?? v) : v;
      
      const quotations = (this.selectedPackages || []).filter(Boolean).map(packageUuid => {
        const pkg = this.packages.find(p => p.packageUuid === packageUuid);
        const services = this.packageServicesMap[packageUuid] || [];
        
        return {
          packageUuid,
          packageName: pkg?.packageName || '',
          planType: services[0]?.planType || '',
          services: services.map(s => {
            const planType = norm(s.planType);
            const description = norm(s.description);
            
            let individualType = s.individualType;
            if (planType === Plan['Individual Plan']) {
              const desc = String(description || '').trim();
              if (['Member', 'Spouse', 'Children'].includes(desc)) {
                individualType = desc;
              } else {
                individualType = 'Member';
              }
            } else {
              individualType = 'NA';
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
    
    saveQuotation() {
      this.$emit('submit', { action: 'save', data: this.buildPayload() });
    },
    
    saveSavedQuotation() {
      this.$emit('submit', { action: 'save', data: this.buildPayload() });
    },
    
    issueQuotation() {
      this.$emit('submit', { action: 'issue', data: this.buildPayload() });
    },
    
    issueSavedQuotation() {
      this.$emit('submit', { action: 'issue', data: this.buildPayload() });
    },
  },
};
</script>