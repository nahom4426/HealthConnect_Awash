<script setup>
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import icons from "@/utils/icons";
import { useAuthStore } from "@/stores/auth";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { useDrugStore } from "../store/drugStore";
import { createDrug } from "../api/drugApi";
import DrugForm from "./form/DrugForm.vue";
import ModalParent from "@/components/ModalParent.vue";

const { submit } = useForm("drugForm");
const req = useApiRequest();
const drugStore = useDrugStore();
const authStore = useAuthStore();
function create({ values, reset }) {
  values.status = "ACTIVE";

  req.send(
    () => createDrug(authStore.auth?.user?.providerUuid, values),
    (res) => {
      if (res.success) {
        drugStore.add(res.data);
        closeModal();
      }
      toasted(res.success, "Serivice Created Successfully", res.error);
    }
  );
}
</script>
<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      class="flex justify-center bg-white"
      title="Add Drug"
      subtitle="Add New Drug"
    >
      <DrugForm />

      <template #bottom>
        <div class="flex gap-5 justify-end items-center w-full">
          <Button
            @click.prevent="closeModal"
            class="flex items-center border border-base-clr text-base font-medium"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            :pending="req.pending.value"
            @click.prevent="submit(create)"
            type="primary"
            class="flex rounded px-6 text-base font-bold items-center !text-white"
            size="lg"
          >
            Add Drug
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
