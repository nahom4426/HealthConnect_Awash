<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import Form from '@/components/new_form_builder/Form.vue';
import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { closeModal } from '@customizer/modal-x';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const route = useRoute();
const { submit } = useForm('create-contract-form');
const req = useApiRequest();

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CLOSED', label: 'Closed' }
];

const createContract = async ({ values }) => {
  const contractData = {
    institutionUuid: props.data.institutionUuid || route.params.Uuid,
    contractName: values.contractName,
    contractCode: values.contractCode,
    benefit: parseFloat(values.benefit),
    premium: parseFloat(values.premium),
    beginDate: values.beginDate,
    endDate: values.endDate,
    status: values.status,
  };

  const response = await req.send(() => 
    req.post('/payer-institution-contract', contractData)
  );

  if (response) {
    toasted('Institution contract created successfully', 'success');
    props.data.onRefetch?.();
    closeModal();
  }
};
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Contract Information"
      subtitle="Create a new institution contract"
    >
      <Form id="create-contract-form" class="grid grid-cols-2 gap-4">
        <Input
          name="contractName"
          label="Category Name"
          validation="required"
          :attributes="{ placeholder: 'Enter category name' }"
        />
        
        <Input
          name="contractCode"
          label="Category Code"
          validation="required"
          :attributes="{ placeholder: 'Enter category code' }"
        />
        
        <Input
          name="benefit"
          label="Benefit"
          type="number"
          validation="required|numeric"
          :attributes="{ placeholder: 'Enter benefit amount', step: '0.01' }"
        />
        
        <Input
          name="premium"
          label="Premium"
          type="number"
          validation="required|numeric"
          :attributes="{ placeholder: 'Enter premium amount', step: '0.01' }"
        />
        
        <Input
          name="beginDate"
          label="Effective Date"
          type="date"
          validation="required"
        />
        
        <Input
          name="endDate"
          label="End Date"
          type="date"
          validation="required"
        />
        
        <div class="col-span-2">
          <Select
            name="status"
            label="Status"
            validation="required"
            :options="statusOptions"
            :attributes="{ placeholder: 'Select status' }"
          />
        </div>
      </Form>

      <template #bottom>
        <div class="flex gap-3 justify-end">
          <Button @click="closeModal" class="border border-gray-300">
            Cancel
          </Button>
          <Button
            :pending="req.pending.value"
            @click="submit(createContract)"
            type="primary"
          >
            Create Contract
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>