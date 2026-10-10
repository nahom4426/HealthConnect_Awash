<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getUserById } from '../Api/UserApi';
import { useApiRequest } from '@/composables/useApiRequest';
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";

const route = useRoute();
const router = useRouter();
const userUuid = route.params.userUuid;
const user = ref({});
const req = useApiRequest();

onMounted(() => {
  if (userUuid) {
    req.send(
      () => getUserById(userUuid),
      (res) => {
        if (res.success) {
          user.value = res.data;
        } else {
          console.error('Failed to fetch user:', res.error);
        }
      }
    );
  }
});

const goBack = () => {
  router.push('/Users');
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
        <p class="text-base">Back to Users</p>
      </button>
    </template>

    <template #default>
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div v-if="req.pending.value" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p class="mt-2 text-ink-muted">Loading user details...</p>
        </div>
        
        <div v-else-if="Object.keys(user).length > 0" class="space-y-8">
          <!-- Header -->
          <div class="border-b pb-4">
            <h1 class="text-2xl font-bold text-ink">{{ user.firstName }} {{ user.fatherName }}</h1>
            <p class="text-ink-muted mt-1">User Details</p>
          </div>

          <!-- User Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Full Name</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink font-medium">{{ user.firstName }} {{ user.fatherName }} {{ user.grandFatherName }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Email</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ user.email }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Mobile Phone</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ user.mobilePhone }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Gender</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink capitalize">{{ user.gender }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Role</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <p class="text-ink">{{ user.roleName }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink-muted mb-2">Status</label>
              <div class="bg-surface-muted p-4 rounded-lg border">
                <span :class="user.userStatus === 'ACTIVE' ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'" 
                      class="px-2 py-1 rounded-full text-sm font-medium">
                  {{ user.userStatus }}
                </span>
              </div>
            </div>
          </div>

          <!-- Privileges Section -->
          <div v-if="user.privileges && user.privileges.length > 0">
            <h2 class="text-lg font-semibold text-ink mb-4">User Privileges</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="privilege in user.privileges" 
                   :key="privilege"
                   class="bg-success-soft border border-success/20 rounded-lg p-4">
                <div class="flex items-center gap-3">
                  <div class="bg-success-soft p-2 rounded-full">
                    <i v-html="icons.shield || icons.check" class="text-success"></i>
                  </div>
                  <p class="font-medium text-success-strong">{{ privilege }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <div class="bg-error-soft p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i v-html="icons.error || icons.warning" class="text-error"></i>
          </div>
          <p class="text-error text-lg">Failed to load user details</p>
          <p class="text-ink-subtle text-sm mt-2">UserUuid: {{ userUuid }}</p>
          <button @click="goBack" class="mt-4 text-primary hover:underline">
            Return to users list
          </button>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>

