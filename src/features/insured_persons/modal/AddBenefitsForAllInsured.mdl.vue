<script setup>
import { computed, ref } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import Form from "@/components/new_form_builder/Form.vue";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import PackageSelector from "@/components/PackageSelector.vue";
import { toasted } from '@/utils/utils';
import { createBenefitsForAllInsured } from '@/features/product_settings/api/coverageApi';
import { useRoute } from 'vue-router';

const apiRequest = useApiRequest();
const selectedPackages = ref([]);
const route = useRoute();
const isReadOnly = computed(() => route.query.pageContext != 'amend');

const props = defineProps({
  data: Object
});

function handleSubmit() {
  if (isReadOnly.value) {
    toasted(false, "", "Benefits are read-only on amend page");
    return;
  }

  const selected = selectedPackages.value.filter(
    (pkg) => pkg.isSelected && Number(pkg.sumAssured) > 0
  );

  for (const pkg of selected) {
    if (pkg.planType === 'Dependent_Shared_Plan') {
      if (!pkg.depSumAssured || Number(pkg.depSumAssured) <= 0) {
        toasted(false, "", `Please set dependent sum assured for ${pkg.packageName} when using Dependent Shared Plan`);
        return;
      }
    }
  }

  if (selected.length === 0) {
    toasted(false, "", "Please select at least one package with a valid sum assured");
    return;
  }

  const payerInstitutionContractUuid = props.data?.payerInstitutionContractUuid;
  if (!payerInstitutionContractUuid) {
    toasted(false, "", "Missing contract association");
    return;
  }

  apiRequest.send(
    () => {
      const payload = selected.map((pkg) => {
        const basePayload = {
          serviceQuotedUuid: props.data?.serviceQuotedUuid || pkg.serviceQuotedUuid || null,
          packageUuid: pkg.packageUuid,
          quotationUuid: props.data?.quotationUuid || pkg.quotationUuid || null,
          sumAssured: Number(pkg.sumAssured) || 0,
          excessUsedBenefit: Number(pkg.excessUsedBenefit) || 0,
          excessAllowed: !!pkg.excessAllowed,
          excessAmount:
            pkg.excessAllowed && pkg.excessType === 'amount'
              ? (pkg.excessUnlimited ? 0 : Math.max(1, Number(pkg.allowedAmount) || 1))
              : 0,
          excessPercentage:
            pkg.excessAllowed && pkg.excessType === 'percentage'
              ? (pkg.excessUnlimited ? 0 : Math.max(1, Number(pkg.excessPercentage) || 1))
              : 0,
          cupPackageUuid: pkg.cupEnabled ? (pkg.cupPackageUuid || null) : null,
          status: pkg.status || 'ACTIVE',
          planType: pkg.planType || 'Individual_Plan',
          depExcessAllowed: !!pkg.depExcessAllowed,
          depExcessAmount:
            pkg.depExcessAllowed && pkg.depExcessType === 'amount'
              ? (pkg.depExcessUnlimited ? 0 : Math.max(1, Number(pkg.depAllowedAmount) || 1))
              : 0,
          depExcessPercentage:
            pkg.depExcessAllowed && pkg.depExcessType === 'percentage'
              ? (pkg.depExcessUnlimited ? 0 : Math.max(1, Number(pkg.depExcessPercentage) || 1))
              : 0,
          depSumAssured: Number(pkg.depSumAssured) || 0,
          depCupPackageUuid: pkg.depCupEnabled ? (pkg.depCupPackageUuid || null) : null,
          deleted: !!pkg.deleted,
        };

        return basePayload;
      });

      return createBenefitsForAllInsured(payerInstitutionContractUuid, payload);
    },
    (res) => {
      if (res.success) {
        toasted(res.success, "Benefits added for all insured successfully!", res.error);
        closeModal();
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xmd"
      class="flex flex-col max-h-[90vh] overflow-hidden"
      title="Add Benefit Packages For All Insured"
      subtitle="Select packages and set sum assured. This will apply to all insured under this institution."
    >
      <div class="overflow-y-auto overflow-x-hidden form-scrollbar">
        <Form
          class="p-6 space-y-6"
          id="packagesFormAll"
          v-slot="{ submit }"
          @submit.prevent="handleSubmit"
        >
          <PackageSelector
            v-model="selectedPackages"
            validation="required"
            :insuredPersonUuid="''"
            :memberGender="null"
            :internalScroll="false"
            :readOnly="isReadOnly"
            :showUsed="false"
            :showDepSumAssuredForIndividual="true"
          />

          <div class="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              @click="closeModal"
              class="p-2 bg-white border border-primary"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              html-type="submit"
              v-if="!isReadOnly"
              :pending="apiRequest.pending.value"
              class="p-2 pt-4 text-white bg-primary"
            >
              Save Packages
            </Button>
          </div>
        </Form>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
