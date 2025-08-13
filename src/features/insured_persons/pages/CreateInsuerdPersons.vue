<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DefaultPage from '@/components/DefaultPage.vue';
import Button from '@/components/Button.vue';
import InsuredPersonForm from '../form/InsuredPersonForm.vue';
import InsuredPersonFormDataProvider from '../form/InsuredPersonFormDataProvider.vue';
import { useAuthStore } from "@/stores/auth";
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
// Get institutionUuid from route params or query
const institutionUuid = ref(
  auth.auth?.payerUuid || 
  route.query.institutionUuid  // Default value for testing
);

// Handle form submission
function handleSubmit(register, data) {
  console.log('Form submitted with data:', data);
  
  register(data)
    .then((res) => {
      console.log('Registration successful:', res);
      router.push('/insured_list');
    })
    .catch(error => {
      console.error('Registration error:', error);
    });
}
</script>

<template>
  <DefaultPage title="Register Insured Person">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <InsuredPersonFormDataProvider :institutionUuid="institutionUuid">
        <template v-slot="{ register, createPending }">
          <InsuredPersonForm 
            ref="insuredPersonForm"
            :pending="createPending"
            @submit="data => handleSubmit(register, data)"
          />
          
          <!-- Form Actions -->
          <div class="flex justify-end gap-4 mt-6">
            <Button 
              @click="router.push('/payer_list')" 
              type="secondary"
            >
              Cancel
            </Button>
            <Button 
              @click="$refs.insuredPersonForm?.handleSubmit()" 
              type="primary"
              :pending="createPending"
            >
              Register Insured Person
            </Button>
          </div>
        </template>
      </InsuredPersonFormDataProvider>
    </div>
  </DefaultPage>
</template>

<style scoped>
.shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
</style>
