<script setup>
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import icons from "@/utils/icons";
import ServiceForm from "../components/form/ServiceForm.vue";
import { createService } from "../api/serviceApi";
import { useService } from "../store/serviceStore";
import { useAuthStore } from "@/stores/auth";
import { toasted } from "@/utils/utils";
import { closeModal } from "@customizer/modal-x";
import { useServiceListStore } from "../store/serviceListStore";
import ModalParent from "@/components/ModalParent.vue";

const { submit } = useForm("serviceForm");
const req = useApiRequest();
const serviceStore = useServiceListStore();
const authStore = useAuthStore();
function create({ values, reset }) {
  values.status = "ACTIVE";
  req.send(
    () => createService(authStore.auth?.user?.providerUuid, values),
    (res) => {
      if (res.success) {
        serviceStore.add(res.data);
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
      title="Add New Services"
      subtitle="Add a New Medical Service"
    >
      <ServiceForm />

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
            Add Service
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
