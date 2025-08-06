<script setup>
import api from "@/scripts/api";
import { ref } from "vue";
import { useForm } from "vee-validate";
import { registerInstitutionSchema } from "@/validations/validations";
import { useToast } from "vue-toastification";
const { errors, handleSubmit, defineInputBinds } = useForm({
  validationSchema: registerInstitutionSchema,
});

const description = ref("");
const item = ref("");

const toast = useToast();

// const providerUuid = ref("bfdabcc8-d9a4-41f7-b1a3-7affc445637d");

const emit = defineEmits(["save"]);
const SaveGroupService = async () => {
  try {
    await api.post(`/service-group`, {
      item: item.value,
      description: description.value,
    },).then((data) => {
      console.log(data);
      emit("save", data);
      toast.success(data.message);
    });
  } catch {
    toast.error(errors.message);
  }
};
</script>

<template>
  <div class="space-y-10 divide-y divide-gray-900/10 flex items-center justify-center">
    <div class=" ">
      <div class="px-4 py-6 sm:p-8">
        <div class="grid max-w-2xl grid-cols-1 sm:grid-cols-6">
          <div class="sm:col-span-3">
            <label for="last-name" class="block text-sm font-medium leading-6 text-gray-900">Services</label>
            <div class="mt-1">
              <input type="text" v-model="item" name="item" id="item" autocomplete="item"
                class="block w-64 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.item }}
              </p>
            </div>
          </div>

          <div class="col-span-full">
            <label for="Description" class="block text-sm font-medium leading-6 text-gray-900">Description</label>
            <div class="mt-1">
              <textarea rows="4" v-model="description" name="description" id="description"
                class="block w-64 h-20 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"></textarea>
              <p class="mt-1 text-sm text-red-600" id="email-error">
                {{ errors.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end gap-x-6 border-gray-900/10 px-4 sm:px-8">
        <button @click="SaveGroupService" type="submit"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          Save
        </button>
      </div>
    </div>
  </div>
</template>
