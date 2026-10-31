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
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-ink-subtle text-white"
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
          <p class="mt-2 text-ink-muted">Loading privilege details...</p>
        </div>
        
        <div v-else-if="Object.keys(privilege).length > 0" class="space-y-8">
          <!-- Header -->
          <div class="border-b pb-4">
            <h1 class="text-2xl font-bold text-ink">{{ privilege.privilegeName }}</h1>
            <p class="text-ink-muted mt-1">Privilege Details</p>
          </div>

          <!-- Privilege Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Privilege Name</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink font-medium">{{ privilege.privilegeName }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Category</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ privilege.privilegeCategory }}</p>
              </div>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-ink-muted mb-2">Description</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ privilege.privilegeDescription }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Privilege Type</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <span class="bg-primary/10 text-primary-hover px-3 py-1 rounded-full text-sm font-medium">
                  {{ getPrivilegeTypeLabel(privilege.privilegeType) }}
                </span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Status</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <span :class="privilege.privilegeStatus === 'ACTIVE' ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'" 
                      class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ privilege.privilegeStatus || 'ACTIVE' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Additional Information -->
          <div class="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-primary-hover mb-3">Privilege Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium text-primary-hover">UUID:</span>
                <span class="text-primary-hover ml-2 font-mono">{{ privilege.privilegeUuid }}</span>
              </div>
              <div v-if="privilege.createdAt">
                <span class="font-medium text-primary-hover">Created:</span>
                <span class="text-primary-hover ml-2">{{ new Date(privilege.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <div class="bg-error-soft p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i v-html="icons.error || icons.warning" class="text-error"></i>
          </div>
          <p class="text-error text-lg">Failed to load privilege details</p>
          <button @click="goBack" class="mt-4 text-primary hover:underline">
            Return to privileges list
          </button>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>