<script setup lang="ts">
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import Button from '@/components/Button.vue';
import { closeModal } from '@customizer/modal-x';
import { ref } from 'vue';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { Plan, allMemberTYpes } from '@/types/interface';
import { updateBenefitRange } from '@/features/product_settings/api/benefitRangeApi';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const row = props.data?.data || props.data || {};

const form = ref({
  familyBenefitRangeUuid: row.familyBenefitRangeUuid || '',
  packageUuid: row.packageUuid || '',
  planType: row.planType || Plan['Individual Plan'],
  familySize: Number(row.familySize) || 1,
  minLimit: Number(row.minLimit) || 0,
  maxLimit: Number(row.maxLimit) || 0,
  rate: Number(row.rate) || 0,
  status: row.status || 'ACTIVE',
});

const api = useApiRequest();

function handleSubmit() {
  if (!form.value.familyBenefitRangeUuid) {
    toasted(false, '', 'Benefit range UUID is missing');
    return;
  }

  const payload = {
    packageUuid: String(form.value.packageUuid || ''),
    maxLimit: Number(form.value.maxLimit) || 0,
    minLimit: Number(form.value.minLimit) || 0,
    familySize: Number(form.value.familySize) || 0,
    rate: Number(form.value.rate) || 0,
    status: form.value.status || 'ACTIVE',
    planType: String(form.value.planType || Plan['Individual Plan']),
  };

  api
    .send(
      () => updateBenefitRange(form.value.familyBenefitRangeUuid, payload),
      (res: any) => {
        if (res?.success) {
          toasted(true, 'Rate updated successfully!', res?.error);
          if (typeof row?.onUpdated === 'function') {
            row.onUpdated({
              ...row,
              ...payload,
              familyBenefitRangeUuid: form.value.familyBenefitRangeUuid,
            });
          }
          closeModal(true);
          return;
        }
        toasted(false, '', res?.error || 'Failed to update rate');
      }
    )
    .catch((e: any) => {
      toasted(false, '', e?.message || 'Failed to update rate');
    });
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="md"
      title="Edit Rate"
      :subtitle="`Plan: ${form.planType || ''}`"
    >
      <Form id="edit-benefit-range" class="p-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-2 gap-4">
          <Select
            class="col-span-2"
            name="planType"
            label="Plan Type"
            v-model="form.planType"
            :options="[
              { label: 'Individual Plan', value: Plan['Individual Plan'] },
              { label: 'Family Plan', value: Plan['Family Plan'] },
              { label: 'Family Shared Plan', value: Plan['Family Shared Plan'] },
            ]"
            :obj="true"
            :attributes="{ placeholder: 'Select Plan Type' }"
            validation="required"
          />

          <Select
            name="familySize"
            label="Family Size"
            v-model="form.familySize"
            :options="allMemberTYpes"
            :obj="true"
            :attributes="{ placeholder: 'Select Family Size' }"
            validation="required"
          />

          <Select
            name="status"
            label="Status"
            v-model="form.status"
            :options="[
              { label: 'ACTIVE', value: 'ACTIVE' },
              { label: 'INACTIVE', value: 'INACTIVE' },
            ]"
            :obj="true"
            :attributes="{ placeholder: 'Select Status' }"
            validation="required"
          />

          <Input
            name="minLimit"
            label="Min Limit"
            v-model="form.minLimit"
            validation="required"
            :attributes="{ type: 'number', placeholder: 'Min Limit' }"
          />

          <Input
            name="maxLimit"
            label="Max Limit"
            v-model="form.maxLimit"
            validation="required"
            :attributes="{ type: 'number', placeholder: 'Max Limit' }"
          />

          <Input
            name="rate"
            label="Rate"
            v-model="form.rate"
            validation="required"
            :attributes="{ type: 'number', placeholder: 'Rate' }"
          />
        </div>

        <div class="flex gap-3 justify-end pt-6">
          <Button
            type="button"
            class="p-2 bg-white border border-primary"
            :pending="api.pending.value"
            @click="closeModal"
          >
            Cancel
          </Button>

          <Button
            type="primary"
            html-type="submit"
            class="p-2 text-white bg-primary"
            :pending="api.pending.value"
          >
            Update
          </Button>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
