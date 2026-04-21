<script setup>
import { ref, onMounted } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import GroupPackageSelector from "../components/GroupPackageSelector.vue";
import { updateServiceQuotedBenefit } from '../api/groupServiceApi';
import { toasted } from '@/utils/utils';
import { useFamily } from '../store/FamilyStore';
import { useRoute } from 'vue-router';

const familysStore = useFamily();

const props = defineProps({
  data: Object
});

const coverageApi = useApiRequest();
const packageUuids = ref([]);
const planType = ref('Individual_Plan');
const route = useRoute();

console.log("Received packages data:", props.data);
console.log("Received packages data:", props.data.packages);
console.log("Converted packageUuids:", packageUuids.value);

// Initialize form with existing data
onMounted(() => {
  if (props.data) {
    // GroupPackageSelector expects array of package objects
    packageUuids.value = [
      {
        packageUuid: props.data.packageUuid || null,
        packageName: props.data.packageName || null,
        isSelected: true,
        sumAssured: Number(props.data.coverage) || 0,
        status: props.data.status || 'ACTIVE',
        planType: props.data.planType || 'Individual_Plan',
      },
    ];
    planType.value = props.data.planType || 'Individual_Plan';
  }
});

function handleUpdateCoverage() {
  const selectedPkg = (packageUuids.value || []).find((p) => p?.isSelected);
  if (!selectedPkg?.packageUuid) {
    toasted(false, '', 'Please select one package');
    return;
  }

  const payerInstitutionContractUuid = route.params.id || '';
  if (!payerInstitutionContractUuid) {
    toasted(false, '', 'Missing payer institution contract UUID');
    return;
  }

  const serviceQuotedUuid = props.data?.serviceQuotedUuid;
  if (!serviceQuotedUuid) {
    toasted(false, '', 'Missing service quoted UUID');
    return;
  }

  const payload = [
    {
      quotationUuid: selectedPkg?.quotationUuid || null,
      packageUuid: selectedPkg.packageUuid,
      description: selectedPkg?.description ?? 0,
      sumAssured: Number(selectedPkg.sumAssured) || 0,
      status: selectedPkg?.status || 'ACTIVE',
      planType: selectedPkg?.planType || planType.value || 'Individual_Plan',
      deleted: !!selectedPkg?.deleted,
    },
  ];
  
  console.log("Submitting values:", payload);

  coverageApi.send(
    () => updateServiceQuotedBenefit(serviceQuotedUuid, payerInstitutionContractUuid, payload),
    (res) => {
      if (res.success) {
        familysStore.update(serviceQuotedUuid, {
          ...props.data,
          serviceQuotedUuid,
          packageUuid: selectedPkg.packageUuid,
          packageName: selectedPkg.packageName,
          coverage: Number(selectedPkg.sumAssured) || 0,
          planType: selectedPkg?.planType || planType.value || 'Individual_Plan',
          description: selectedPkg?.description ?? 0,
        });
        toasted(res.success, "Coverage plan updated successfully!", res.error);
        closeModal({ success: true });
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      :title="'Edit Coverage'"
      subtitle="Update Coverage Plan"
    >
      <div class="grid grid-cols-1 gap-8 p-6">
        <div class="space-y-8">
          <div class="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h3 class="mb-4 text-lg font-bold text-gray-900">Benefit Packages</h3>
            <GroupPackageSelector
              v-model="packageUuids"
              label=""
              validation="required"
              mode="edit"
              :serviceQuotedUuid="props.data?.serviceQuotedUuid"
            />
          </div>

          <div class="flex justify-end">
            <Button
              :pending="coverageApi.pending.value"
              type="primary"
              class="px-6 py-3 text-white rounded-lg bg-primary hover:bg-primary-100"
              :disabled="!(packageUuids || []).some(p => p?.isSelected)"
              @click.prevent="handleUpdateCoverage"
            >
              Update Coverage Plan
            </Button>
          </div>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-move {
  transition: transform 0.3s ease;
}

.radio-option {
  transition: all 0.2s ease;
}
.radio-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}
</style>