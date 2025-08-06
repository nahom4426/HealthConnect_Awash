<script setup>
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { useRoute } from "vue-router";
import ServiceForm from "../components/form/ServiceForm.vue";
import { useService } from "../store/serviceStore";
import { getServiceByid, updateService } from "../api/serviceApi.js";

import { ref } from "vue";
import { useServiceListStore } from "../store/serviceListStore";
import ModalParent from "@/components/ModalParent.vue";
const props = defineProps({
  data: String,
});

const { submit } = useForm("serviceForm");
const serviceStore = useServiceListStore();

const service = ref(
  serviceStore.serviceList.find((el) => el.serviceUuid == props.data) || {}
);
const req = useApiRequest();

if (!Object.keys(service.value).length) {
  req.send(
    () => getServiceByid(props.data),
    (res) => {
      if (res.success) {
        service.value = res.data;
      }
    }
  );
}

function update({ values }) {
  values.status = "ACTIVE";
  req.send(
    () => updateService(props.data, values),
    (res) => {
      toasted(res.success, "Successfully Updated", res.error);
      if (res.success) {
        serviceStore.update(props.data, { ...service.value, ...values });
      }
    }
  );
}
</script>
<template>
  <ModalParent>
    <NewFormParent
      size="md"
      class="flex justify-center bg-white"
      title="Update Service"
      subtitle="Update medical service"
    >
      <ServiceForm :services="service" />

      <template #bottom>
        <div class="flex justify- w-full p-2 px-4">
          <Button
            class="flex w-full items-center gap-3 bg-primary !text-white py-3"
            :pending="req.pending.value"
            type="primary"
            @click.prevent="submit(update)"
            >Update Service</Button
          >
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
