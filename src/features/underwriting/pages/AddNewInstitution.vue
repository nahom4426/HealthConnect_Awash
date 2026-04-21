<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import { useApiRequest } from "@/composables/useApiRequest";
import DefaultPage from "@/components/DefaultPage.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Form from "@/components/new_form_builder/Form.vue";
import Button from "@/components/Button.vue";
import { useForm } from "@/components/new_form_builder/useForm";
import icons from "@/utils/icons";

const toast = useToast();
const router = useRouter();
const { submit } = useForm('add-institution-form');
const req = useApiRequest();

const saveInstitution = async ({ values }) => {
  const response = await req.send(() => 
    req.post('/institution', {
      ...values,
      latitude: 0,
      longitude: 0,
      status: 'ACTIVE'
    })
  );

  if (response) {
    toast.addToast('Institution Registered Successfully!', 'success');
    router.push({
      name: 'add-institution-contracts',
      params: { Uuid: response.institutionUuid }
    });
  }
};
</script>

<template>
  <DefaultPage title="Add Policy Holders">
    <template #add-action>
      <button
        @click="router.go(-1)"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      >
        <i v-html="icons.arrow_left"></i>
        <p class="text-base">Back</p>
      </button>
    </template>

    <template #default>
      <div class="w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 m-3">
        <Form id="add-institution-form" class="grid space-y-4">
          <!-- Policy Holder Information -->
          <div class="sm:col-span-6 text-sm font-semibold bg-gray-100 px-2">
            Policy Holder Information
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              name="institutionName"
              label="Group Policy Name"
              validation="required"
              :attributes="{ placeholder: 'Enter institution name', maxlength: 40 }"
            />

            <Input 
              name="tinNumber"
              label="Tin Number"
              :attributes="{ placeholder: 'Enter TIN number', maxlength: 25 }"
            />

            <Input 
              name="email"
              label="Email" 
              validation="required|email"
              :attributes="{ placeholder: 'Enter email address', maxlength: 35 }"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              name="category"
              label="Business Category"
              validation="required"
              :attributes="{ placeholder: 'Enter category' }"
            />

            <Input 
              name="telephone"
              label="Telephone" 
              validation="required"
              :attributes="{ placeholder: '+251910023296', maxlength: 13 }"
            />
          </div>

          <!-- Address Information -->
          <div class="sm:col-span-6 text-sm font-semibold bg-gray-100 px-2">
            Address Information
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              name="country"
              label="Country"
              validation="required"
              :attributes="{ value: 'Ethiopia', disabled: true }"
            />

            <Input 
              name="state"
              label="State" 
              validation="required"
              :attributes="{ placeholder: 'Enter state' }"
            />

            <Input 
              name="address3"
              label="City" 
              validation="required"
              :attributes="{ placeholder: 'Enter city' }"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              name="address2"
              label="Sub City" 
              validation="required"
              :attributes="{ placeholder: 'Enter sub city' }"
            />

            <Input 
              name="address1"
              label="Woreda" 
              validation="required"
              :attributes="{ placeholder: 'Enter woreda' }"
            />
          </div>

          <div class="flex justify-end mt-8">
            <Button 
              @click="submit(saveInstitution)" 
              :pending="req.pending.value"
              type="primary"
              class="flex justify-center items-center gap-2 rounded-md px-6 py-4"
            >
              <i v-if="req.pending.value" v-html="icons.loader"></i>
              <span>{{ req.pending.value ? 'Processing...' : 'Next' }}</span>
            </Button>
          </div>
        </Form>
      </div>
    </template>
  </DefaultPage>
</template>