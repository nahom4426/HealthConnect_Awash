<script setup lang="ts">
import Button from "@/components/Button.vue";
import Form from "@/components/new_form_builder/Form.vue";
import Select from "@/components/new_form_elements/Select.vue";
import {
  allMemberTYpes,
  FamilyPackageGender,
  getFamilyTypes,
  isFemaleOnlyPackage,
  Plan,
  type ButtonClickHandler,
  type FamilyPackage,
} from "@/types/interface";
import icons from "@/utils/icons";
import { computed, ref, watch, onMounted, type PropType } from "vue";
import type { QuoatedService } from "../pages/CreateNewQuotaions.vue";
import { formatCurrency, formatNumber, genId } from "@/utils/utils";
import QuotaionInput from "../components/QuotaionInput.vue";
import QuotationSelect from "../components/QuotationSelect.vue";
import { getPackageRate } from "@/features/quotation/api/quotationApi";

const props = defineProps({
  pending: {
    type: Boolean,
    default: false,
  },
  quotations: Object,
  packages: {
    type: Array as PropType<FamilyPackage[]>,
    required: true,
  },
  onSubmit: {
    type: Function as PropType<ButtonClickHandler>,
  },
  prefill: {
    type: Array as PropType<{ packageName: string; planType: string; services: QuoatedService[] }[]>,
    required: false,
    default: undefined,
  },
  showHeaderControls: {
    type: Boolean,
    default: true,
  },
  readOnlyRows: {
    type: Boolean,
    default: false,
  },
  acceptMode: {
    type: Boolean,
    default: false,
  },
  issueMode: {
    type: Boolean,
    default: false,
  },
  acceptLabel: {
    type: String,
    default: 'Accept',
  },
  quotationUuid: {
    type: String,
    default: '',
  },
  viewIssued: {
    type: Object,
    default: () => ({}),
  },
  viewAccepted: {
    type: Object,
    default: () => ({}),
  },  
  viewSaved: {
    type: Object,
    default: () => ({}),
  },
  viewAcccepted: {
    type: Object,
    default: () => ({}),
  },
  showIssuePremiumAdvice: {
    type: Boolean,
    default: false,
  },
  showAmendButton: {
    type: Boolean,
    default: false,
  },
});

const quotations = ref<QuoatedService[]>([]);
const formatedQuotations = ref<
  { packageName: string; planType: string; services: QuoatedService[] }[]
>([]);

const plan = ref([
  { label: "Individual Plan", value: Plan["Individual Plan"] },
  { label: "Family Plan", value: Plan["Family Plan"] },
  { label: "Family Shared Plan", value: Plan["Family Shared Plan"] },
]);

const selectedPackage = ref("");
const selectedPlan = ref();

const canAdd = computed(() => !!selectedPackage.value && !!selectedPlan.value);

const coverageTypeOptions = computed(() =>
  filterdPackages.value.map((pkg) => ({
    value: pkg.packageUuid,
    label: pkg.packageName,
  }))
);

const filterdPackages = computed(() => {
  const selected = quotations.value.map((el) => el.packageUuid);
  return props.packages.filter((el) => !selected.includes(el.packageUuid));
});

const packageName = computed(
  () => (packageUuid: string) =>
    props.packages.find((el) => el.packageUuid == packageUuid)?.packageName
);

onMounted(() => {
  if (props.prefill && Array.isArray(props.prefill) && props.prefill.length) {
    formatedQuotations.value = props.prefill as any;
    quotations.value = (props.prefill as any).flatMap((q: any) => q.services || []);
  }
});

function addService() {
  if (!selectedPackage.value || !selectedPlan.value) return;
  const idx = formatedQuotations.value.findIndex(
    (el) => el.packageName == packageName.value(selectedPackage.value)
  );

  if (idx > -1) return;

  const newData: QuoatedService = {
    packageUuid: selectedPackage.value,
    numberOfInsured: 0,
    description: 0,
    rate: 0,
    premium: 0,
    sumInsured: 0,
    coverage: 0,
    serviceQuotedUuid: genId.next().value as string,
    planType: (typeof selectedPlan.value === 'object' && selectedPlan.value)
      ? (selectedPlan.value as any).value
      : selectedPlan.value,
    individualType: "NA",
    spouse: false,
  };

  quotations.value.unshift(newData);

  formatedQuotations.value.unshift({
    packageName: packageName.value(selectedPackage.value) || "",
    planType: (typeof selectedPlan.value === 'object' && selectedPlan.value)
      ? (selectedPlan.value as any).value
      : selectedPlan.value,
    services: [newData],
  });

  selectedPackage.value = "";
  selectedPlan.value = "";
}

async function onDescriptionChange(service: QuoatedService, quote: { packageName: string; planType: any }) {
  try {
    const normalize = (val: any) =>
      typeof val === 'object' && val !== null
        ? val.value ?? val.id ?? val.label
        : val;

    const rawDesc: any = service.description;
    const parsedDesc = normalize(rawDesc);
    
    if (!service.planType && !quote.planType) {
      if (typeof parsedDesc === 'string') {
        const desc = parsedDesc.toLowerCase();
        if (desc.includes('individual')) {
          service.planType = Plan['Individual Plan'];
        } else if (desc.includes('family') && desc.includes('shared')) {
          service.planType = Plan['Family Shared Plan'];
        } else if (desc.includes('family')) {
          service.planType = Plan['Family Plan'];
        }
      }
    }
    
    const effectivePlanType = normalize(service.planType ?? quote.planType);
    const familySize = (effectivePlanType === Plan['Family Plan'] || effectivePlanType === Plan['Family Shared Plan']) 
      ? Number(parsedDesc) || 1 
      : 1;
    
    const toPlanParam = (val: any) => {
      const base = normalize(val);
      if (base === Plan['Individual Plan']) return 'Individual_Plan';
      if (base === Plan['Family Plan']) return 'Family_Plan';
      if (base === Plan['Family Shared Plan']) return 'Family_Shared_Plan';
      return String(base).replace(/\s+/g, '_');
    };
    
    const planParam = toPlanParam(service.planType ?? quote.planType);
    
    const resp: any = await getPackageRate({
      packageUuid: service.packageUuid,
      planType: planParam,
      familySize,
    });
    
    const payload = resp?.data;
    
    const rate =
      (typeof payload === 'number' ? payload : undefined) ??
      payload?.rate ??
      payload?.data?.rate ??
      payload?.benefitRange?.rate ??
      0;
      
    service.rate = Number(rate) || 0;
    
  } catch (e) {
    console.error('[RateFetch] error', e);
    service.rate = 0;
  }
}

function addToService(packageName: string, service: QuoatedService) {
  const idx = formatedQuotations.value.findIndex(
    (el) => el.packageName == packageName
  );

  if (idx < 0) return;

  formatedQuotations.value[idx].services.unshift({
    ...service,
    serviceQuotedUuid: genId.next().value as string,
  });
}

function Service(quote: { packageName: string; services: QuoatedService[] }, service: QuoatedService) {
  const newService: QuoatedService = {
    packageUuid: service.packageUuid,
    serviceQuotedUuid: genId.next().value as string,
    numberOfInsured: 0,
    description: 0,
    rate: 0,
    premium: 0,
    sumInsured: 0,
    coverage: 0,
    planType: service.planType,
    individualType: service.individualType,
    spouse: service.spouse,
  };
  quote.services.unshift(newService);
}

const removeService = (quote: { services: QuoatedService[] }, serviceToRemove: QuoatedService) => {
  const index = quote.services.findIndex(s => s === serviceToRemove);
  if (index !== -1) {
    quote.services.splice(index, 1);
  }
};

const minmax = computed(() => {
  return (name: string) => {
    const pack = props.packages?.find((el) => el.packageName == name);
    return { min: pack?.minLimit, max: pack?.maxLimit } || 0;
  };  
});

const des = computed(() => (service: QuoatedService) => isNaN(service.description) ? 1 : service.description)

const rate = computed(
  () => (packageName: string, coverage: number, size: number) => {
    const packages = props.packages?.find(
      (el) => el.packageName == packageName
    );
    const limit = packages?.benefitRanges?.find(
      (el) =>
        el.familySize == size &&
        coverage >= el.minLimit &&
        coverage <= el.maxLimit
    );
    return limit?.rate || 0;
  }
);

const premium = computed(() => {
  return (packageName: string, service: QuoatedService) => {
    const sum =
      (service.numberOfInsured *
        service.coverage *
        service.rate) /
      100;
    return sum * des.value(service);
  };
});

const totalSumInsured = computed(() => {
  return (service: QuoatedService) => {
    const sum = service.coverage * service.numberOfInsured;
    if (service.planType == Plan["Family Shared Plan"])
      return sum * des.value(service)
    return sum;
  };
});

function buildPayload() {
  const norm = (v: any) =>
    (typeof v === 'object' && v !== null) ? (v.value ?? v.id ?? v.label ?? v) : v;

  const mapped = formatedQuotations.value.map((q) => {
    const qPlan = norm((q as any).planType);
    return {
      ...q,
      services: q.services.map((s) => {
        const sPlan = norm(s.planType ?? qPlan);
        const desc = norm(s.description);
        let individualType = s.individualType;

        if (sPlan === Plan['Individual Plan']) {
          const d = String(desc ?? '').trim();
          if (d === 'Member' || d === 'Spouse' || d === 'Children') {
            individualType = d as any;
          } else {
            individualType = 'Member' as any;
          }
        } else {
          individualType = 'NA' as any;
        }

        return { ...s, individualType };
      }),
    };
  });

  const payload: any = {
    quotations: mapped,
  };
  
  if (props.quotationUuid) {
    payload.quotationUuid = props.quotationUuid;
  }
  
  return payload;
}

function saveQuotation() {
  if (props.onSubmit) {
    (props.onSubmit as any)({ action: 'save', data: buildPayload() });
  }
}
function saveSavedQuotation() {
  if (props.onSubmit) {
    props.onSubmit({ action: 'save', data: buildPayload() });
  } else {
    console.error('onSubmit handler is not defined');
  }
}

function issueQuotation() {
  if (props.onSubmit) {
    (props.onSubmit as any)({ action: 'issue', data: buildPayload() });
  }
}

function issueSavedQuotation() {
  if (props.onSubmit) {
    props.onSubmit({ action: 'issue', data: buildPayload() });
  } else {
    console.error('onSubmit handler is not defined');
  }
}
</script>

<template>
  <Form id="quotaion-form">
    <!-- Compact Header Card -->
    <div
      v-if="props.showHeaderControls"
      class="p-6 mb-6 bg-white rounded-lg border shadow-sm border-slate-200"
    >
      <div class="flex justify-between items-center mb-5">
        <div>
          <h3 class="text-lg font-semibold text-slate-800">Add New Coverage</h3>
          <p class="mt-1 text-sm text-slate-500">Select a coverage type and plan to add to your quotation</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 gap-4 items-end md:grid-cols-3">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Coverage Type</label>
          <Select
            :obj="true"
            v-model="selectedPackage"
            name="selectedPackage"
            :options="coverageTypeOptions"
            :attributes="{
              placeholder: 'Select coverage type',
              class: '!h-10 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm'
            }"
          />
        </div>
        
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700">Plan Type</label>
          <Select
            :obj="true"
            v-model="selectedPlan"
            name="familyPlan"
            :options="
              isFemaleOnlyPackage(packages, packageName(selectedPackage) || '')
                ? [{ label: 'Individual Plan', value: Plan['Individual Plan'] }]
                : plan
            "
            :attributes="{
              placeholder: 'Select plan type',
              class: '!h-10 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm'
            }"
          />
        </div>
        
        <div>
          <Button
            @click.prevent="addService"
            class="w-full h-10 font-medium text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!canAdd"
          >
            Add Coverage
          </Button>
        </div>
      </div>
      
      <div v-if="!canAdd" class="p-3 mt-4 bg-amber-50 rounded-lg border border-amber-200">
        <div class="flex gap-2 items-center text-sm text-amber-800">
          <svg class="flex-shrink-0 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>Select both coverage type and plan type to add coverage</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!quotations.length && props.showHeaderControls"
      class="flex flex-col items-center py-12 rounded-lg border-2 border-dashed bg-slate-50 border-slate-300"
    >
      <div class="mb-4 text-slate-400">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p class="text-base font-medium text-slate-600">No Coverage Selected</p>
      <p class="mt-1 text-sm text-slate-500">Add a coverage type above to get started</p>
    </div>

    <!-- Coverage Cards - More Compact -->
    <div
      class="space-y-4"
      v-if="formatedQuotations.length > 0"
    >
      <div
        v-for="(quote, quoteIndex) in formatedQuotations"
        :key="`quote-${quoteIndex}`"
        class="overflow-hidden bg-white rounded-lg border border-slate-200"
      >
        <!-- Compact Card Header -->
        <div class="px-5 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-slate-200">
          <div class="flex justify-between items-center">
            <div class="flex gap-3 items-center">
              <div class="w-2 h-6 bg-blue-600 rounded"></div>
              <div>
                <h4 class="font-semibold text-slate-800">{{ quote.packageName }}</h4>
                <span class="px-2 py-0.5 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                  {{ quote.planType }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Compact Services Table -->
        <div class="p-4">
          <!-- Table Header - More Compact -->
          <div class="grid grid-cols-12 gap-3 px-3 py-2 mb-3 text-xs font-semibold tracking-wide uppercase rounded bg-slate-50 text-slate-500">
            <div class="col-span-2">Insured</div>
            <div class="col-span-2">Plan Type</div>
            <div class="col-span-2">Description</div>
            <div class="col-span-2">Sum Insured</div>
            <div class="col-span-1">Rate</div>
            <div class="col-span-2">Premium</div>
            <div class="col-span-1 text-right">Action</div>
          </div>

          <!-- Services Rows - More Compact -->
          <div class="space-y-3">
            <div
              v-for="(service, serviceIndex) in quote.services"
              :key="`service-${serviceIndex}`"
              class="grid grid-cols-12 gap-3 items-start px-3 py-3 bg-white rounded border border-slate-100 hover:bg-blue-50/30"
            >
              <!-- Number of Insured -->
              <div class="col-span-2">
                <QuotaionInput
                  v-model="service.numberOfInsured"
                  validation="required|num"
                  name="numberOfInsured"
                  :attributes="{
                    placeholder: 'Number',
                    class: '!h-9 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-center'
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
                  :options="
                    isFemaleOnlyPackage(packages, quote.packageName)
                      ? [{ label: 'Individual Plan', value: Plan['Individual Plan'] }]
                      : plan
                  "
                  @update:modelValue="() => { service.description = 0; service.rate = 0 }"
                  :attributes="{
                    placeholder: 'Select plan',
                    class: '!h-9 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm'
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
                  :options="getFamilyTypes(packages, quote.packageName, service.planType)"
                  @update:modelValue="() => onDescriptionChange(service, quote)"
                  :attributes="{
                    placeholder: 'Select',
                    class: '!h-9 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm'
                  }"
                />
              </div>

              {{ (service.individualType = Plan["Individual Plan"] == service.planType ? 'NA' : service.planType.split(' ')?.[0] as any) && '' }}

              <!-- Sum Insured & Total Sum Insured - Combined -->
              <div class="col-span-2 space-y-1">
                <QuotaionInput
                  v-model="service.coverage"
                  :validation="{
                    required: true,
                    num: true,
                    num_minmax: {
                      args: [
                        minmax(quote.packageName).min,
                        minmax(quote.packageName).max,
                      ],
                      message: `${minmax(quote.packageName).min} - ${formatNumber(
                        minmax(quote.packageName).max
                      )}`,
                    },
                  }"
                  name="coverage"
                  :attributes="{
                    placeholder: 'Amount',
                    class: '!h-9 !rounded-lg border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-right'
                  }"
                />
                <div class="text-xs text-right text-slate-500">
                  Total: {{ formatCurrency(totalSumInsured(service)) }}
                </div>
              </div>

              {{ (service.sumInsured = totalSumInsured(service)) ? "" : "" }}

              <!-- Rate -->
              <div class="col-span-1">
                <QuotaionInput
                  :value="service.rate"
                  name="rate"
                  :attributes="{
                    disabled: true,
                    class: '!h-9 !rounded-lg border-slate-200 bg-slate-50 text-sm text-right font-medium text-blue-600'
                  }"
                />
              </div>

              <!-- Premium -->
              <div class="col-span-2">
                <QuotaionInput
                  :value="formatCurrency(premium(quote.packageName, service))"
                  name="premium"
                  :attributes="{
                    disabled: true,
                    class: '!h-9 !rounded-lg border-slate-200 bg-emerald-50 text-sm text-right font-semibold text-emerald-700'
                  }"
                />
              </div>

              {{ (service.premium = premium(quote.packageName, service)) ? '' : '' }}

              <!-- Actions - Compact -->
              <div class="col-span-1 text-right">
                <Button
                  v-if="!issueMode && !showIssuePremiumAdvice"
                  @click.prevent="Service(quote, service)"
                  class="p-1.5 text-blue-600 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100"
                  title="Duplicate row"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Form>

  <!-- Compact Footer Actions -->
  <div class="pt-6 mt-6 border-t border-slate-200">
    <div class="flex justify-between items-center">
      <div class="text-sm text-slate-500">
        Services: <span class="font-medium text-slate-700">{{ quotations.length }}</span>
      </div>
      
      <div class="flex gap-3">
        <div v-if="props.showAmendButton">
          <Button 
            type="secondary" 
            @click="$emit('amend')"
            class="px-5 py-2 text-sm font-medium rounded-lg border border-slate-300 hover:border-slate-400"
            :loading="false"
          >
            Amend
          </Button>
        </div>
        
        <template v-if="props.showIssuePremiumAdvice">
          <Button 
            type="primary" 
            @click="$emit('submit', { action: 'issuePremiumAdvice', data: buildPayload() })"
            class="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            Issue Premium Advice
          </Button>
        </template>
        
        <template v-else-if="props.issueMode">
          <Button 
            type="primary" 
            @click="$emit('submit', { action: 'accept', data: buildPayload() })"
            class="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            {{ props.acceptLabel }}
          </Button>
        </template>
        
        <template v-else-if="!props.acceptMode">
          <Button 
            @click.prevent="saveQuotation"
            class="px-5 py-2 text-sm font-medium bg-white rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50"
          >
            Save
          </Button>
          
          <Button 
            @click.prevent="issueQuotation"
            class="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Issue
          </Button>
        </template>
        
        <template v-else>
          <Button 
            @click.prevent="saveSavedQuotation"
            class="px-5 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-300 hover:bg-blue-100"
          >
            Save Changes
          </Button>
          
          <Button 
            @click.prevent="issueSavedQuotation"
            class="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Issue Saved
          </Button>
        </template>
      </div>
    </div>
  </div>
</template>