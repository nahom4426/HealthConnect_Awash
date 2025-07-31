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
import { computed, ref, watch, type PropType } from "vue";
import type { QuoatedService } from "../pages/CreateNewQuotaions.vue";
import { formatCurrency, formatNumber, genId } from "@/utils/utils";
import QuotaionInput from "../components/QuotaionInput.vue";
import QuotationSelect from "../components/QuotationSelect.vue";

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

const filterdPackages = computed(() => {
  const selected = quotations.value.map((el) => el.packageUuid);
  return props.packages.filter((el) => !selected.includes(el.packageUuid));
});

const packageName = computed(
  () => (packageUuid: string) =>
    props.packages.find((el) => el.packageUuid == packageUuid)?.packageName
);

function addService() {
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
    planType: selectedPlan.value,
    individualType: "NA",
    spouse: false,
  };

  quotations.value.unshift(newData);

  formatedQuotations.value.unshift({
    packageName: packageName.value(selectedPackage.value) || "",
    planType: selectedPlan.value,
    services: [newData],
  });

  selectedPackage.value = "";
  selectedPlan.value = "";
}

function addToService(packageName: string, service: QuoatedService) {
  const idx = formatedQuotations.value.findIndex(
    (el) => el.packageName == packageName
  );

  if (!idx) return;

  formatedQuotations.value[idx].services.unshift({
    ...service,
    serviceQuotedUuid: genId.next().value as string,
  });
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
</script>
<template>
  <Form id="quotaion-form">
    <div
      class="border-b-2 box-border pb-3 grid grid-cols-[1fr_1fr_max-content] gap-2"
    >
      <Select
        :obj="true"
        v-model="selectedPackage"
        label="Select Coverage Type"
        name="selectedPackage"
        :options="
          filterdPackages.map((pack) => ({
            value: pack.packageUuid,
            label: pack.packageName,
          }))
        "
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
        type="elevated"
        class="self-end"
        >Add</Button
      >
    </div>
    <div
      v-if="!quotations.length"
      class="flex flex-col items-center justify-center min-h-full"
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
        class="grid grid-cols-[repeat(6,1fr)_6rem] gap-3"
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
          v-model="service.description"
          label="Description"
          validation="required"
          name="description"
          :options="getFamilyTypes(packages, quote.packageName, quote.planType)"
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
          :value="
            rate(
              quote.packageName,
              service.coverage,
              quote.planType == Plan['Family Plan'] ? service.description : 1
            )
          "
          label="Rate"
          name="rate"
          :attributes="{
            disabled: true,
            placeholder: 'Rate',
          }"
        />
        {{
          (service.rate = rate(
            quote.packageName,
            service.coverage,
            quote.planType == Plan["Family Plan"] ? service.description : 1
          )) ? "" : ""
        }}
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
      </div>
    </div>
  </Form>
</template>
