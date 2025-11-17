<script setup>
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import NewFormParent from "@/components/NewFormParent.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { useRoute } from "vue-router";

import { ref } from "vue";
import { useDrugStore } from "../store/drugStore";
import { updateDrug } from "../api/drugApi";
import DrugForm from "./form/DrugForm.vue";
import { closeModal } from "@customizer/modal-x";
import { data } from "autoprefixer";
const props = defineProps({
  data: String,
});

const { submit } = useForm("drugForm");
const drugStore = useDrugStore();

const drug = ref(drugStore.drugs.find((el) => el.drugUuid == props.data) || {});
const req = useApiRequest();
console.log(drug.value);
console.log(Object.keys(drug.value));

if (!Object.keys(drug.value).length) {
  req.send(
    () => getServiceByid(props.data),
    (res) => {
      if (res.success) {
        drug.value = res.data;
      }
    }
  );
}

function update({ values }) {
  console.log(props.data);

  values.status = "ACTIVE";
  req.send(
    () => updateDrug(props.data, values),
    (res) => {
      toasted(res.success, "Successfully Updated", res.error);
      if (res.success) {
        console.log(drug);

        drugStore.update(props.data, { ...drug.value, ...values });
        closeModal();
      }
    }
  );
}
</script>
<template>
  <div class="bg-black/50 min-h-full p-4 grid place-items-center">
    <NewFormParent
      size="md"
      class="flex justify-center bg-white"
      title="Update Drug"
      subtitle="Update  drug information"
    >
      <DrugForm :drugs="drug" />

      <template #bottom>
        <div class="flex justify- w-full p-2 px-4">
          <Button
            class="flex w-full items-center gap-3 bg-primary !text-white"
            :pending="req.pending.value"
            type="primary"
            @click.prevent="submit(update)"
            >Update Drug</Button
          >
        </div>
      </template>
    </NewFormParent>
  </div>
</template>
