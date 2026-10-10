<script setup>
import { useApiRequest } from '@/composables/useApiRequest';
import { ref } from 'vue';
import NewFormParent from '@/components/NewFormParent.vue';
import Button from '@/components/Button.vue';
import ContractForm from '../form/ContractForm.vue';
import { useForm } from '@/components/new_form_builder/useForm';
import { toasted } from '@/utils/utils';
import ModalParent from '@/components/ModalParent.vue';
import { closeModal } from "@customizer/modal-x";
import { useInstitutionContract } from '../store/institutionContractsStore';
import { updateInstitutionContract, updateBenefitContributions } from '../api/underwritingApi';
import { getPackages } from '@/features/product_settings/api/coverageApi';

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

const showLocationSection = ref(false);
const showAdditionalSection = ref(false);
const data = ref({
  ...props.data.contract,
  payerInstitutionContractUuid: props.data.payerInstitutionContractUuid || props.data.contract.payerInstitutionContractUuid
});
const institution = useInstitutionContract();
const updateReq = useApiRequest();
const { submit } = useForm('create-contract-form');

function update({ values }) {
  
  const payload = { ...values };

  updateReq.send(
    () => {
      return updateInstitutionContract(data.value.payerInstitutionContractUuid , payload);
    },
    (res) => {
      if (res.success) {
        institution.updateInstitution(res.data.payerInstitutionContractUuid, res.data);
        toasted(res.success, 'Institution updated successfully', res.error);
        window.dispatchEvent(new CustomEvent('editContractSuccess'));
        
        if (res.data?.payerInstitutionContractUuid) {
          getPackages().then((pkgRes) => {
            const pkgs = Array.isArray(pkgRes?.data) ? pkgRes.data : (Array.isArray(pkgRes) ? pkgRes : []);
            const contributions = pkgs.map((pkg) => ({
              benefitPackageUuid: pkg.packageUuid || pkg.uuid,
              contributionPercentage: 100
            }));
            updateBenefitContributions(res.data.payerInstitutionContractUuid, contributions).catch(err => console.error(err));
          });
        }
        closeModal();
      }
    }
  );
}

</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="Update Contract" subtitle="Edit the contract details below">
      <ContractForm ref="contractForm" :showLocationSection="showLocationSection" :showAdditionalSection="showAdditionalSection"
        @toggle-location="showLocationSection = !showLocationSection"
        @toggle-additional="showAdditionalSection = !showAdditionalSection" :data="data" :is-edit="true" />

      <template #bottom>
        <div class="flex gap-4 justify-end p-6 bg-surface-muted border-t border-line">
          <Button type="button" @click="closeModal"
            class="px-6 py-3 font-medium text-ink-muted rounded-lg border-2 border-line-strong transition-colors duration-200 hover:bg-surface-muted">
            Cancel
          </Button>
          <Button type="button" :pending="updateReq.pending.value" @click.prevent="submit(update)"
            class="flex gap-2 items-center px-8 py-3 font-medium text-white bg-gradient-to-r from-primary to-primary rounded-lg shadow-lg transition-all duration-200 hover:from-primary hover:to-primary-hover hover:shadow-xl">
            <svg v-if="!updateReq.pending.value" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ updateReq.pending.value ? 'Updating...' : 'Update Contract' }}
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>