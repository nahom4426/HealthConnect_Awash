<script setup>
import { ref } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { createServiceQuotedBenefits } from "../api/groupServiceApi";
import GroupPackageSelector from "../components/GroupPackageSelector.vue";
import { useRoute } from "vue-router";
import { toasted } from '@/utils/utils';
import { useFamily } from '../store/FamilyStore';

const route = useRoute();
const coverageApi = useApiRequest();
const selectedPackages = ref([]);
const familyStore = useFamily();

function handleSubmit() {
  const payerInstitutionContractUuid = route.params.id || '';

  if (!payerInstitutionContractUuid) {
    toasted(false, '', 'Missing payer institution contract UUID');
    return;
  }

  const selected = (selectedPackages.value || []).filter(
    (pkg) => pkg?.isSelected && Number(pkg?.sumAssured) > 0
  );

  if (selected.length === 0) {
    toasted(false, '', 'Please select at least one package with a valid sum assured');
    return;
  }

  const payload = selected.slice(0, 1).map((pkg) => ({
    quotationUuid: pkg?.quotationUuid || null,
    packageUuid: pkg?.packageUuid,
    description: pkg?.description ?? 0,
    sumAssured: Number(pkg?.sumAssured) || 0,
    status: pkg?.status || 'ACTIVE',
    planType: pkg?.planType || 'Individual_Plan',
    deleted: !!pkg?.deleted,
  }));

  coverageApi.send(
    () => createServiceQuotedBenefits(payerInstitutionContractUuid, payload),
    (res) => {
      if (res?.success) {
        toasted(true, 'Benefits saved successfully!', '');
        const created = res?.data;
        const list = Array.isArray(created) ? created : (created ? [created] : []);
        for (const item of list) {
          familyStore.add(item);
        }
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
      title="Create Coverage"
      subtitle="Select benefit packages and set sum assured"
    >
      <div class="p-6">
        <div class="overflow-hidden bg-white rounded-2xl border border-line shadow-sm">
          <div class="p-6 border-b border-line">
            <h3 class="text-lg font-bold text-ink">Select Benefit Packages</h3>
            <p class="mt-1 text-sm text-ink-subtle">Choose packages and set sum assured. Plan type is selected per package.</p>
          </div>

          <div class="p-6">
            <GroupPackageSelector
              v-model="selectedPackages"
              validation="required"
              :internalScroll="true"
              mode="add"
            />
          </div>

          <div class="flex flex-col gap-3 justify-end p-4 border-t border-line sm:p-6 bg-surface-muted/60 sm:flex-row">
            <Button
              type="button"
              class="px-6 py-3 text-ink-muted rounded-lg border border-line-strong hover:bg-surface-muted"
              @click.prevent="closeModal"
            >
              Cancel
            </Button>
            <Button
              :pending="coverageApi.pending.value"
              type="primary"
              class="px-6 py-3 text-white rounded-lg bg-primary"
              @click.prevent="handleSubmit"
            >
              Save
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
