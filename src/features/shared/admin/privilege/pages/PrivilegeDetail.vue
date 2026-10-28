<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPrivilegeById } from '../Api/PrivilegeApi';
import { useApiRequest } from '@/composables/useApiRequest';
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";

const route = useRoute();
const router = useRouter();
const privilegeUuid = route.params.privilegeUuid;
const privilege = ref({});
const req = useApiRequest();

onMounted(() => {
  if (privilegeUuid) {
    req.send(
      () => getPrivilegeById(privilegeUuid),
      (res) => {
        if (res.success) {
          privilege.value = res.data;
        }
      }
    );
  }
});

const goBack = () => {
  router.push('/privileges');
};

const getPrivilegeTypeLabel = (type) => {
  const types = {
    'FOR_ALL': 'For All',
    'FOR_SYSTEM_ADMIN': 'Admin',
    'FOR_PROVIDER': 'Provider',
    'FOR_PAYER': 'Payer'
  };
  return types[type] || type;
};
</script>

<template>
  <DefaultPage>
    <template #add-action>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-gray-500 text-white"
        @click="goBack"
      >
        <i v-html="icons.arrow_left"></i>
        <p class="text-base">Back to Privileges</p>
      </button>
    </template>

    <template #default>
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div v-if="req.pending.value" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading privilege details...</p>
        </div>
        
        <div v-else-if="Object.keys(privilege).length > 0" class="space-y-8">
          <!-- Header -->
          <div class="border-b pb-4">
            <h1 class="text-2xl font-bold text-gray-900">{{ privilege.privilegeName }}</h1>
            <p class="text-gray-600 mt-1">Privilege Details</p>
          </div>

          <!-- Privilege Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Privilege Name</label>
              <div class="bg-gray-50 p-4 rounded-lg border">
                <p class="text-gray-900 font-medium">{{ privilege.privilegeName }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div class="bg-gray-50 p-4 rounded-lg border">
                <p class="text-gray-900">{{ privilege.privilegeCategory }}</p>
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <div class="bg-gray-50 p-4 rounded-lg border">
                <p class="text-gray-900">{{ privilege.privilegeDescription }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Privilege Type</label>
              <div class="bg-gray-50 p-4 rounded-lg border">
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {{ getPrivilegeTypeLabel(privilege.privilegeType) }}
                </span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div class="bg-gray-50 p-4 rounded-lg border">
                <span :class="privilege.privilegeStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                      class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ privilege.privilegeStatus || 'ACTIVE' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-blue-900 mb-3">Privilege Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-blue-800">UUID:</span>
                <span class="text-blue-700 ml-2 font-mono">{{ privilege.privilegeUuid }}</span>
              </div>
              <div v-if="privilege.createdAt">
                <span class="font-medium text-blue-800">Created:</span>
                <span class="text-blue-700 ml-2">{{ new Date(privilege.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <div class="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i v-html="icons.error || icons.warning" class="text-red-400"></i>
          </div>
          <p class="text-red-600 text-lg">Failed to load privilege details</p>
          <button @click="goBack" class="mt-4 text-primary hover:underline">
            Return to privileges list
          </button>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>