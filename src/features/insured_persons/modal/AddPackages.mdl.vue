<script setup>
import { ref } from 'vue';
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import { closeModal } from "@customizer/modal-x";
import Form from "@/components/new_form_builder/Form.vue";
import Button from "@/components/Button.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import PackageSelector from "@/components/PackageSelector.vue";
import { toasted } from '@/utils/utils';
import { addPackages } from '@/features/product_settings/api/coverageApi';

const apiRequest = useApiRequest();
const selectedPackages = ref([]);

const props = defineProps({
  data: Object
});

function handleSubmit() {
  const payload = {
    packages: selectedPackages.value
      .filter(pkg => pkg.isSelected && pkg.sumAssured > 0)
      .map(pkg => ({
        packageUuid: pkg.packageUuid,
        sumAssured: pkg.sumAssured
      }))
  };

  if (payload.packages.length === 0) {
    toasted(false, "Please select at least one package with a valid sum assured");
    return;
  }

  apiRequest.send(
    () => addPackages(props.data.insuredUuid, payload),
    (res) => {
      if (res.success) {
        toasted(res.success, "Packages added successfully!", res.error);
        closeModal();
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Add Benefit Packages"
      subtitle="Select packages and set sum assured for this insured person"
    >
      <Form
        class="p-6 space-y-6"
        id="packagesForm"
        v-slot="{ submit }"
        @submit.prevent="handleSubmit"
      >
        <PackageSelector
          v-model="selectedPackages"
          label="Available Packages"
          validation="required"
          :insuredPersonUuid="data.insuredUuid"
        />

        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            
            @click="closeModal"
            class="bg-white border border-primary p-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            class="bg-primary text-white p-2 pt-4"
          >
            Save Packages
          </Button>
        </div>
      </Form>
    </NewFormParent>
  </ModalParent>
</template>
