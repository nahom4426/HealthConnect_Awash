<script setup lang="ts">
import Button from "@/components/Button.vue";
import Form from "@/components/new_form_builder/Form.vue";
import InputParent from "@/components/new_form_builder/InputParent.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import Input from "@/components/new_form_elements/Input.vue";
import InputError from "@/components/new_form_elements/InputError.vue";
import Select from "@/components/new_form_elements/Select.vue";
import Textarea from "@/components/new_form_elements/Textarea.vue";
import Table from "@/components/Table.vue";
import icons from "@/utils/icons";
import { formatCurrency, genId, secondDateFormat } from "@/utils/utils";
import { computed, ref, watch, type PropType } from "vue";
import type { CashService } from "../../store/searchCashCreditInsuredInstitutionStore";

interface Packages {
  packageName: string;
  packageUuid: string;
}

interface Value {
  hospital: string,
  cashService: CashService[]
}

const props = defineProps({
  servicesPending: {
    type: Boolean,
    default: false,
  },
  service: {
    type: Object as PropType<Value>
  },
  services: {
    type: Array as PropType<Packages[]>,
    default: [],
  },
});


const selectedServices = ref<CashService[]>(props.service?.cashService || []);
const service = ref<CashService>({
  cashServiceUuid: '',
  serviceDate: "",
  packageUuid: "",
  amount: 0,
  serviceName: "",
});

const serviceOptions = computed(() => {
  const options = (props.services || []).filter(
    (el: any) =>
      !selectedServices.value.find(
        (service) => service.packageUuid == el.packageUuid
      )
  );

  if (service.value?.packageUuid) {
    options.unshift({
      packageUuid: service.value?.packageUuid,
      packageName:
        props.services.find(
          (el: any) => el.packageUuid == service.value?.packageUuid
        )?.packageName || "",
    });
  }
  return options;
});

function addService({ values, reset }: any) {
  const idx = selectedServices.value.findIndex(
    (el) => el.cashServiceUuid == service.value.cashServiceUuid
  );

  if (idx == -1) {
    selectedServices.value.unshift({
      ...service.value,
      cashServiceUuid: genId.next().value as string,
    });
  } else {
    selectedServices.value.splice(idx, 1, {
      ...selectedServices.value[idx],
      ...service.value,
    });
  }
  reset();
}

function remove(id: string) {
  const idx = selectedServices.value.findIndex(
    (el) => el.cashServiceUuid == id
  );

  if (idx == -1) return;

  selectedServices.value.splice(idx, 1);
}
</script>
<template>
  <Form :inner="false" id="service-form" class="grid grid-cols-2 gap-4">
    <Input
      :value="props.service?.hospital || ''"
      groupIndentifier="main-service"
      name="hospital"
      label="Hospital"
      validation="required"
      :attributes="{
        placeholder: 'Enter Hospital Name',
      }"
    />
    <InputParent
      groupIndentifier="main-service"
      validation="serviceRequired"
      v-model="selectedServices"
      name="cashServices"
      v-slot="{ setRef, error }"
    >
      <div class="col-span-2 !px-0" :ref="setRef">
        <InputError :error="error" />
        <Form
          v-slot="{ submit }"
          class="border-t pt-2 gap-4 grid grid-cols-3"
          id="inner-service"
        >
          <Input
            validation="required"
            v-model="service.serviceDate"
            name="serviceDate"
            label="Service Provided Date"
            :attributes="{
              type: 'date',
            }"
          />
          <Select
            :obj="true"
            v-model="service.packageUuid"
            name="packageUuid"
            :pending="servicesPending"
            label="Service Category"
            validation="required"
            :attributes="{
              placeholder: 'Select Service',
            }"
            :options="(serviceOptions || []).map((el: any) => ({label: el.packageName, value: el.packageUuid}))"
          />
          <Input
            v-model="service.amount"
            name="amount"
            label="Amount"
            :attributes="{
              placeholder: 'Amount',
            }"
            validation="required|price"
          />
          <Textarea
            v-model="service.serviceName"
            name="serviceName"
            validation="required"
            label="Service Description"
            :attributes="{
              placeholder: 'Service Description',
            }"
          />
          <div class="col-span-2 flex items-end">
            <Button @click.prevent.stop="submit(addService)" type="primary">
              Add
            </Button>
          </div>
        </Form>
      </div>
      <Table
        class="col-span-2"
        :headers="{
          head: [
            'Service Provided',
            'Service Category',
            'Service Description',
            'Amount',
            'actions',
          ],
          row: ['serviceDate', 'packageUuid', 'serviceName', 'amount'],
        }"
        :cells="{
					serviceDate: secondDateFormat,
					packageUuid: (uuid: string) => {
						return (services as any).find((el: any) => el.packageUuid == uuid)?.packageName
					},
					amount: formatCurrency
				}"
        :rows="selectedServices"
      >
        <template #placeholder>
          <div class="flex justify-center p-4 font-bold">No services Added</div>
        </template>
        <template #actions="{ row }">
          <div class="p-2 flex items-center gap-2">
            <button
              @click.prevent.stop="() => remove(row.cashServiceUuid || '')"
              class="size-6 bg-black/10 grid place-items-center shadow-md rounded-full text-red-300"
            >
              <i class="*:size-4" v-html="icons.delete" />
            </button>
            <button
              @click.prevent.stop="service = { ...row }"
              class="size-6 bg-black/10 grid place-items-center shadow-md rounded-full"
            >
              <i class="*:size-3" v-html="icons.edit" />
            </button>
          </div>
        </template>
      </Table>
    </InputParent>
  </Form>
</template>
<style>
.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr) 5rem;
}
</style>
