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

// Options for coverage type come from fetched packages
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
  console.log(idx);

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
    const rawDesc: any = service.description;
    const parsedDesc = typeof rawDesc === 'object' && rawDesc !== null ? (rawDesc.value ?? rawDesc.id ?? rawDesc.label ?? rawDesc) : rawDesc;
    const familySize = quote.planType == Plan['Family Plan'] ? Number(parsedDesc) : 1;
    const toPlanParam = (val: any) => {
      const base = (typeof val === 'object' && val !== null) ? (val.value ?? val) : val;
      if (val === Plan['Individual Plan']) return 'Individual_Plan';
      if (val === Plan['Family Plan']) return 'Family_Plan';
      if (val === Plan['Family Shared Plan']) return 'Family_Shared_Plan';
      return String(base).replace(/\s+/g, '_');
    };
    const planParam = toPlanParam(service.planType ?? quote.planType);
    // Debugging aid: ensure parameters are correct
    console.debug('[RateFetch] params', { packageUuid: service.packageUuid, planType: planParam, familySize });
    const resp: any = await getPackageRate({
      packageUuid: service.packageUuid,
      planType: planParam,
      familySize,
    });
    const payload = resp?.data;
    console.debug('[RateFetch] response', payload);
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
  const copy: QuoatedService = {
    ...service,
    serviceQuotedUuid: genId.next().value as string,
  };
  // Insert at the top of the same quote group
  quote.services.unshift(copy);
}

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
  // Normalize helper to extract primitive from Select values
  const norm = (v: any) =>
    (typeof v === 'object' && v !== null) ? (v.value ?? v.id ?? v.label ?? v) : v;

  // Build quotations with corrected individualType based on plan/description
  const mapped = formatedQuotations.value.map((q) => {
    const qPlan = norm((q as any).planType);
    return {
      ...q,
      services: q.services.map((s) => {
        const sPlan = norm(s.planType ?? qPlan);
        const desc = norm(s.description);
        let individualType = s.individualType;

        // If Individual Plan: derive individualType from SharedlMemberTYpes (Description options)
        if (sPlan === Plan['Individual Plan']) {
          const d = String(desc ?? '').trim();
          if (d === 'Member' || d === 'Spouse' || d === 'Children') {
            individualType = d as any;
          } else {
            // Fallback for unexpected description values under Individual Plan
            individualType = 'Member' as any;
          }
        } else {
          // Non-individual plans do not specify individual type
          individualType = 'NA' as any;
        }

        return { ...s, individualType };
      }),
    };
  });

  const payload: any = {
    quotations: mapped,
  };
  
  // Include quotationUuid in the payload if it exists
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
    <div
      v-if="props.showHeaderControls"
      class="border-b-2 box-border pb-3 grid grid-cols-[1fr_1fr_max-content] gap-2 items-end"
    >
      <Select
        :obj="true"
        v-model="selectedPackage"
        label="Select Coverage Type"
        name="selectedPackage"
        :options="coverageTypeOptions"
        :attributes="{
          placeholder: 'Select Coverage Type',
        }"
      />
      <Select
        :obj="true"
        v-model="selectedPlan"
        label="Plan Type"
        name="familyPlan"
        :options="
          isFemaleOnlyPackage(packages, packageName(selectedPackage) || '')
            ? [{ label: 'Individual Plan', value: Plan['Individual Plan'] }]
            : plan
        "
        :attributes="{
          placeholder: 'Select Plan',
        }"
      />
      <Button
        :class="[selectedPlan && selectedPackage ? '' : '!shadow-none']"
        @click.prevent="addService"
        class="self-end h-14 bg-green-600 text-white hover:bg-green-500"
        :disabled="!canAdd"
        :title="!canAdd ? 'Select Coverage Type and Plan Type first' : undefined"
        >Add</Button
      >
    </div>
    <p v-if="props.showHeaderControls && !canAdd" class="text-sm text-red-600 mt-1">Select Coverage Type and Plan Type to enable Add.</p>
    <div
      v-if="!quotations.length"
      class="flex flex-col items-center justify-center "
    >
      <i class="*:size-40" v-html="icons.quotations" />
      <p class="text-lg font-semibold">No Coverage Selected</p>
    </div>
    <div
      class="flex flex-col gap-1 pt-2"
      v-if="formatedQuotations.length > 0"
      :key="quote.planType"
      v-for="quote in formatedQuotations"
    >
      <div>
        <span class="font-semibold text-md">{{ quote.packageName }}</span>
      </div>
      <div
        :key="service.serviceQuotedUuid"
        v-for="service in quote.services"
        class="grid grid-cols-[repeat(7,1fr)_6rem] gap-3"
      >
        <QuotaionInput
          v-model="service.numberOfInsured"
          label="# Insured"
          validation="required|num"
          name="numberOfInsured"
          :attributes="{
            placeholder: '# of insured',
          }"
        />
        <QuotationSelect
          :obj="true"
          v-model="service.planType"
          label="Plan Type"
          validation="required"
          name="rowPlanType"
          :options="
            isFemaleOnlyPackage(packages, quote.packageName)
              ? [{ label: 'Individual Plan', value: Plan['Individual Plan'] }]
              : plan
          "
          @update:modelValue="() => { service.description = 0; service.rate = 0 }"
          :attributes="{
            placeholder: 'Select Plan',
          }"
        />
        <QuotationSelect
          :obj="true"
          v-model="service.description"
          label="Description"
          validation="required"
          name="description"
          :options="getFamilyTypes(packages, quote.packageName, service.planType)"
          @update:modelValue="() => onDescriptionChange(service, quote)"
          :attributes="{
            placeholder: 'Description',
          }"
        />
				{{ (service.individualType = Plan["Individual Plan"] == service.planType ? 'NA' : service.planType.split(' ')?.[0] as any) && ''  }}
        <QuotaionInput
          v-model="service.coverage"
          label="Sum Insured"
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
            placeholder: 'Sum Insured',
          }"
        />
        <QuotaionInput
          :value="formatCurrency(totalSumInsured(service))"
          :skip="true"
          label="Total Sum Insured"
          name="TotalSumInsured"
          :attributes="{
            disabled: true,
            placeholder: 'Total Sum Insured',
          }"
        />
        {{ (service.sumInsured = totalSumInsured(service)) ? "" : "" }}
        <QuotaionInput
          :value="service.rate"
          label="Rate"
          name="rate"
          :attributes="{
            disabled: true,
            placeholder: 'Rate',
          }"
        />
        <QuotaionInput
          :value="formatCurrency(premium(quote.packageName, service))"
          label="Premium"
          name="premium"
          :attributes="{
            disabled: true,
            placeholder: 'Premium',
          }"
        />
        {{ (service.premium = premium(quote.packageName, service)) ? '' : '' }}
        <Button v-if="!issueMode && !showIssuePremiumAdvice" class="h-6 mt-auto w-fit bg-blue-500 hover:bg-blue-600 text-white" @click.prevent="Service(quote, service)">Duplicate</Button>
      </div>
    </div>
  </Form>
  <div class="mt-4 flex justify-end gap-3">
    <template v-if="props.showIssuePremiumAdvice">
      <Button type="primary" @click="$emit('submit', { action: 'issuePremiumAdvice', data: buildPayload() })">
        Issue Premium Advice
      </Button>
    </template>
    <template v-else-if="props.issueMode">
      <Button type="primary" @click="$emit('submit', { action: 'accept', data: buildPayload() })">
        {{ props.acceptLabel }}
      </Button>
    </template>
    <template v-else-if="!props.acceptMode">
      <Button class="bg-orange-600 text-white hover:bg-orange-500" @click.prevent="saveQuotation">Save Quotation</Button>
      <Button class="bg-green-700 text-white hover:bg-green-600" @click.prevent="issueQuotation">Issue Quotation</Button>
    </template>
    <template v-else>
      <Button class="bg-blue-600 text-white hover:bg-blue-500 mr-2" @click.prevent="saveSavedQuotation">
        Save Changes
      </Button>
      <Button class="bg-green-700 text-white hover:bg-green-600" @click.prevent="issueSavedQuotation">
        Issue Saved
      </Button>
    </template>
  </div>
</template>
