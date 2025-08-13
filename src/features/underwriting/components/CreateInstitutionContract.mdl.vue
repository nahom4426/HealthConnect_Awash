<script setup>
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { useRoute } from 'vue-router';
import { createInstitutionContract } from '../api/underwritingApi';
import ContractForm from "../form/ContractForm.vue";
import { useInstitutionContract } from "../store/institutionContractsStore";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const { submit } = useForm("create-contract-form");
const req = useApiRequest();
const route = useRoute();
const institutionStore = useInstitutionContract();

function createContract({ values }) {
  const contractData = {
    institutionUuid: props.data.institutionUuid || route.params.id,
    contractName: values.contractName,
    contractCode: values.contractCode,
    benefit: parseFloat(values.benefit) || 0,
    premium: parseFloat(values.premium) || 0,
    beginDate: values.beginDate,
    endDate: values.endDate,
    quotationUuid: values.quotationUuid || "string",
    multiGroupUuid: values.multiGroupUuid || "string",
    status: values.status || 'ACTIVE'
  };

  req.send(
    () => createInstitutionContract(contractData),
    (res) => {
      if (res.success) {
        toasted('Institution contract created successfully', 'success');
        institutionStore.addInstitution(res.data);
        props.data.onRefetch?.();
        closeModal();
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xl"
      title="Create Contract"
      subtitle="Define a new contract with benefits and premium details"
    >
      <div class="max-h-[80vh] overflow-y-auto">
        <ContractForm :data="data" />
      </div>

      <template #bottom>
        <div class="flex gap-4 justify-end p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <Button
            type="button"
            @click="closeModal"
            class="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Cancel
          </Button>
          <Button
            type="button"
            :pending="req.pending.value"
            @click="submit(createContract)"
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            {{ req.pending.value ? 'Creating Contract...' : 'Create Contract' }}
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
