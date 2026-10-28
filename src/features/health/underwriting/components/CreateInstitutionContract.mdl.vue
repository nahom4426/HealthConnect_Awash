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
    policyNumber: values.policyNumber,
    benefit: parseFloat(values.benefit) || 0,
    premium: parseFloat(values.premium) || 0,
    beginDate: values.beginDate,
    endDate: values.endDate,
    quotationUuid: values.quotationUuid,
    multiGroupUuid: values.multiGroupUuid || "string",
    status: values.status || 'ACTIVE'
  };

  req.send(
    () => createInstitutionContract(contractData),
    (res) => {
      const payload = res?.data || res;
      const isSuccess = !!(payload?.payerInstitutionContractUuid || res?.success);


      if (!isSuccess) {
        toasted(false, "", res?.error || "Failed to create institution contract");
        return;
      }

      toasted('Institution contract created successfully', 'success');
      if (payload) {
        institutionStore.addInstitution(payload);
      }

      props.data.onRefetch?.();

      try {
        window.dispatchEvent(
          new CustomEvent('underwriting:institution-contract-created', {
            detail: {
              payerInstitutionContractUuid: payload?.payerInstitutionContractUuid,
              institutionUuid: payload?.institutionUuid,
            },
          })
        );
      } catch (e) {
        // no-op
      }
      closeModal();
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
        <div class="flex gap-4 justify-end p-6 bg-gradient-to-r from-surface-muted to-surface-muted border-t border-line">
          <Button
            type="button"
            @click="closeModal"
            class="px-6 py-3 font-medium text-ink-muted rounded-lg border-2 border-line-strong shadow-sm transition-all duration-200 hover:bg-surface-muted hover:shadow-md"
          >
            Cancel
          </Button>
          <Button
            type="button"
            :pending="req.pending.value"
            @click="submit(createContract)"
            class="flex gap-2 items-center px-8 py-3 font-medium text-white bg-gradient-to-r from-primary to-primary rounded-lg shadow-lg transition-all duration-200 hover:from-primary hover:to-primary-hover hover:shadow-xl"
          >
            {{ req.pending.value ? 'Creating Contract...' : 'Create Contract' }}
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
