<script setup>
import * as session from '@/scripts/session';
import { useRouter, useRoute } from 'vue-router';
import api from '@/scripts/api';
import { mdiHospitalBuilding, mdiPlus } from '@mdi/js';
import { ref, onMounted } from 'vue';
import { useForm, ErrorMessage } from 'vee-validate';
import { registerInstitutionSchema } from '@/validations/validations';
import { Field } from 'vee-validate';
import { useToast } from '@/toast/store/toast';

const toast = useToast();
const route = useRoute();

const isLoading = ref('false');
const contractName = ref('');
const contractCode = ref('');
const beginDate = ref('');
const endDate = ref('');
const description = ref('');

const emit = defineEmits(['close'])

const { errors } = useForm({
  validationSchema: registerInstitutionSchema,
});

const createContract = async () => {
  isLoading.value = true;
  try {
    await api.post('/payer-provider-contract', {
      providerUuid: route.params.Uuid,
      contractName: contractName.value,
      contractCode: contractCode.value,
      description: description.value,
      beginDate: beginDate.value,
      endDate: endDate.value,
    }).then((data) => {
      isLoading.value = false;
      toast.success(data.message);
      emit('close')
    });
  } catch (e) {
    isLoading.value = false;
    toast.error(e.message);
  }
};

</script>

<template>
  <div class="flex justify-center items-center space-y-10 divide-y divide-ink/10">
    <div class="">
      <form @submit.prevent="submit" class="md:col-span-2">
        <div class="px-4 py-6 sm:px-8 sm:py-4">
          <div class="grid grid-cols-1 gap-y-4 gap-x-6 max-w-2xl sm:grid-cols-6">
            <div class="px-2 text-lg font-semibold bg-surface-muted sm:col-span-6">
              Contract Info
            </div>
            <div class="sm:col-span-3">
              <label for="contract-name" class="block font-medium leading-6 text-ink">Contract Name</label>
              <div class="mt-1">
                <input type="text" v-model="contractName" name="Contract Name" id="contract-name" rules="required"
                  class="block py-1.5 w-full text-ink-muted rounded-md border-0 ring-1 ring-inset ring-line-strong shadow-sm placeholder:text-ink-subtle focus:ring-1 focus:ring-inset focus:ring-primary/30 sm:leading-6" />
                <ErrorMessage name="Contract Name" class="text-xs text-error" />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="contract-code" class="block font-medium leading-6 text-ink">Contract Code</label>
              <div class="mt-1">
                <input type="text" v-model="contractCode" name="Contract Code" id="contract-code" rules="required"
                  class="block py-1.5 w-full text-ink-muted rounded-md border-0 ring-1 ring-inset ring-line-strong shadow-sm placeholder:text-ink-subtle focus:ring-1 focus:ring-inset focus:ring-primary/30 sm:leading-6" />
                <ErrorMessage name="Contract Code" class="text-xs text-error" />
              </div>
            </div>

            <div class="sm:col-span-3">
              <label for="status" class="block font-medium leading-6 text-ink">Effective Date From</label>
              <div class="mt-1">
                <input type="date" v-model="beginDate" name="beginDate" id="beginDate" rules="required"
                  class="block py-1.5 w-full text-ink-muted rounded-md border-0 ring-1 ring-inset ring-line-strong shadow-sm placeholder:text-ink-subtle focus:ring-1 focus:ring-inset focus:ring-primary/30 sm:leading-6" />

                <ErrorMessage name="beginDate" class="text-xs text-error" />
              </div>
            </div>
            <div class="sm:col-span-3">
              <label for="premium" class="block font-medium leading-6 text-ink">Effective Date To</label>
              <div class="mt-1">
                <input type="datetime-local" v-model="endDate" name="endDate" id="endDate" rules="required"
                  class="block py-1.5 w-full text-ink-muted rounded-md border-0 ring-1 ring-inset ring-line-strong shadow-sm placeholder:text-ink-subtle focus:ring-1 focus:ring-inset focus:ring-primary/30 sm:leading-6" />
                <ErrorMessage name="endDate" class="text-xs text-error" />
              </div>
            </div>

            <div class="flex col-span-full">
              <div>
                <label for="street-address" class="block font-medium leading-6 text-ink">Description</label>
                <div class="mt-1">
                  <Field v-slot="{ errors }" v-model="description" name="Description" rules="required">
                    <textarea v-model="description" name="Description" class="rounded-lg" placeholder="Write here . . ."
                      rows="2" cols="30" :class="errors[0]
        ? 'ring-1 ring-error focus:ring-1 focus:ring-error border-error focus:border-error focus:outline-none'
        : ''
        " />
                    <small v-if="errors[0]" class="mt-1 font-light text-error">{{ errors[0] }}</small>
                  </Field>
                </div>
              </div>

              <div class="flex gap-x-6 justify-start items-end py-3 ml-10 w-full border-ink/10">
                <button type="submit" @click="createContract"
                  class="px-3 py-2 w-full text-xl font-semibold text-white bg-primary rounded-md shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
