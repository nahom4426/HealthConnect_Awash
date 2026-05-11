<script setup>
import { useRoute, useRouter } from 'vue-router';
import { useApiRequest } from '@/composables/useApiRequest';
import { getPrivilegeById, updatePrivilege } from '../Api/PrivilegeApi';
import PrivilegeForm from '../form/PrivilegeForm.vue';
import { usePrivilege } from '../store/privilegeStore';
import { ref, watch } from 'vue';
import { toasted } from '@/utils/utils.js';
import Button from '@/components/Button.vue';
import { useForm } from '@/components/new_form_builder/useForm';

const router = useRouter();
const { submit } = useForm('privilegeForm');
const privilegeStore = usePrivilege();
const route = useRoute();
const privilegeUuid = route.params.privilegeUuid;
const req = useApiRequest();
const updateReq = useApiRequest();


const privilege = ref(
    privilegeStore.privilege.find((el) => el.privilegeUuid == privilegeUuid) || {}
);

if (!Object.keys(privilege.value).length) {
    req.send(
        () => getPrivilegeById(privilegeUuid),
        (res) => {
            if (res.success) {
                privilege.value = res.data;
               
            }
        }
    );
} 


function update({ values }) {
     updateReq.send(
        () => updatePrivilege(privilegeUuid, values),
        (res) => {
            if (res.success) {
                privilegeStore.update(privilegeUuid, { ...privilege.value, ...values });
                router.push('/privileges');
                toasted(res.success, 'Successfully Updated', res.error);
            } else {
                toasted(false, '', res.error || 'Failed to update privilege');
            }
        }
    );
}


</script>
<template>
  <div class="p-4 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-8xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">Update Privilege</h1>
        <p class="mt-2 text-gray-600">Modify privilege details and permissions</p>
      </div>

      <!-- Form Card -->
      <div class="overflow-hidden bg-white rounded-2xl shadow-lg">
        <!-- Form Header -->
        <div class="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-200 sm:px-8">
          <h2 class="text-lg font-semibold text-gray-900">Privilege Details</h2>
        </div>

        <!-- Form Content -->
        <div class="p-6 space-y-6 sm:p-8">
          <PrivilegeForm :privilege="privilege" />

          <!-- Info Alert -->
          <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div class="flex gap-3">
              <svg class="flex-shrink-0 mt-0.5 w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div>
                <p class="text-sm font-medium text-amber-900">
                  <strong>Field Requirements:</strong>
                </p>
                <ul class="mt-2 space-y-1 text-sm list-disc list-inside text-amber-800">
                  <li>All fields must be at least 3 characters long</li>
                  <li>Privilege Name and Category must be less than 50 characters</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button
              size="md"
              class="flex flex-1 gap-2 justify-center items-center font-semibold text-white rounded-lg transition-all duration-200 bg-primary hover:bg-primary/90"
              :pending="updateReq.pending.value"
              @click.prevent="submit(update)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Update Privilege
            </Button>
            <button
              @click="$router.back()"
              class="flex flex-1 gap-2 justify-center items-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg transition-all duration-200 hover:bg-gray-200"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
