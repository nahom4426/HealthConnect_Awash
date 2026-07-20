<script setup>
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import { useForm } from "@/components/new_form_builder/useForm";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { useRoute } from 'vue-router';
import { createInstitutionContract, updateBenefitContributions } from '../api/underwritingApi';
import { getPackages } from '@/features/product_settings/api/coverageApi';
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

      console.log('[CreateInstitutionContract] response:', res);
      console.log('[CreateInstitutionContract] payload:', payload);
      console.log('[CreateInstitutionContract] isSuccess:', isSuccess);

      if (!isSuccess) {
        toasted(false, "", res?.error || "Failed to create institution contract");
        return;
      }

      toasted('Institution contract created successfully', 'success');
      if (payload) {
        institutionStore.addInstitution(payload);
      }

      if (payload?.payerInstitutionContractUuid) {
        getPackages().then((pkgRes) => {
          const pkgs = Array.isArray(pkgRes?.data) ? pkgRes.data : (Array.isArray(pkgRes) ? pkgRes : []);
          const contributions = pkgs.map((pkg) => ({
            benefitPackageUuid: pkg.packageUuid || pkg.uuid,
            contributionPercentage: 100
          }));
          updateBenefitContributions(payload.payerInstitutionContractUuid, contributions).catch(err => console.error(err));
        });
      }

      console.log('[CreateInstitutionContract] calling onRefetch:', typeof props.data.onRefetch);
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
        <div class="flex gap-4 justify-end p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <Button
            type="button"
            @click="closeModal"
            class="px-6 py-3 font-medium text-gray-700 rounded-lg border-2 border-gray-300 shadow-sm transition-all duration-200 hover:bg-gray-100 hover:shadow-md"
          >
            Cancel
          </Button>
          <Button
            type="button"
            :pending="req.pending.value"
            @click="submit(createContract)"
            class="flex gap-2 items-center px-8 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
          >
            {{ req.pending.value ? 'Creating Contract...' : 'Create Contract' }}
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
