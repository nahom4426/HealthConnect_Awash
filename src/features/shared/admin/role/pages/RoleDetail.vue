<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getRoleById } from '../Api/RoleApi';
import { useApiRequest } from '@/composables/useApiRequest';
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";

const route = useRoute();
const router = useRouter();
const roleUuid = route.params.roleUuid;
const role = ref({});
const req = useApiRequest();

onMounted(() => {
  if (roleUuid) {
    req.send(
      () => getRoleById(roleUuid),
      (res) => {
        if (res.success) {
          role.value = res.data;
        }
      }
    );
  }
});

const goBack = () => {
  router.push('/roles');
};
</script>

<template>
  <DefaultPage>
    <template #add-action>
      <button
        class="flex justify-center items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg bg-gradient-to-r from-ink-subtle to-ink-muted text-white font-semibold transition-all duration-200 hover:shadow-lg active:scale-95"
        @click="goBack"
      >
        <i v-html="icons.arrow_left" class="text-lg"></i>
        <p class="hidden sm:inline">Back to Roles</p>
      </button>
    </template>

    <template #default>
      <div class="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
        <!-- Loading State -->
        <div v-if="req.pending.value" class="p-8 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-ink-muted">Loading role details...</p>
        </div>
        
        <!-- Content -->
        <div v-else-if="Object.keys(role).length > 0" class="space-y-6 sm:space-y-8">
          <!-- Header -->
          <div class="border-b pb-4 sm:pb-6">
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-ink">{{ role.roleName }}</h1>
            <p class="text-sm sm:text-base text-ink-muted mt-2">Role Details & Permissions</p>
          </div>

          <!-- Role Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div class="bg-gradient-to-br from-primary/5 to-primary/5 p-4 sm:p-6 rounded-lg border border-primary/20">
              <label class="block text-xs sm:text-sm font-semibold text-primary-hover mb-2 uppercase tracking-wide">Role Name</label>
              <p class="text-base sm:text-lg font-bold text-primary-hover">{{ role.roleName }}</p>
            </div>
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-lg border border-purple-200">
              <label class="block text-xs sm:text-sm font-semibold text-purple-900 mb-2 uppercase tracking-wide">Description</label>
              <p class="text-sm sm:text-base text-purple-900">{{ role.roleDescription || 'No description' }}</p>
            </div>
          </div>

          <!-- Privileges Section -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <h2 class="text-lg sm:text-xl font-bold text-ink">Assigned Privileges</h2>
              <span v-if="role.rolePrivileges" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary-hover">
                {{ role.rolePrivileges.length }}
              </span>
            </div>
            
            <div v-if="role.rolePrivileges && role.rolePrivileges.length > 0" 
                 class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div v-for="privilege in role.rolePrivileges" 
                   :key="privilege.privilegeUuid"
                   class="bg-gradient-to-br from-primary/5 to-cyan-50 border border-primary/20 rounded-lg p-3 sm:p-4 hover:shadow-md hover:border-primary/30 transition-all duration-200">
                <div class="flex items-start gap-3">
                  <div class="bg-primary/10 p-2 rounded-full flex-shrink-0">
                    <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-primary-hover text-sm sm:text-base truncate">{{ privilege.privilegeName }}</h4>
                    <p class="text-xs sm:text-sm text-primary-hover mt-1 line-clamp-2">{{ privilege.privilegeDescription }}</p>
                    <span class="inline-block mt-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{{ privilege.privilegeCategory }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Empty State -->
            <div v-else class="text-center py-8 sm:py-12 bg-surface-muted rounded-lg border-2 border-dashed border-line-strong">
              <div class="bg-line p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <svg class="w-6 h-6 sm:w-8 sm:h-8 text-ink-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <p class="text-ink-muted text-base sm:text-lg font-semibold">No privileges assigned</p>
              <p class="text-ink-subtle text-xs sm:text-sm mt-1">This role currently has no privileges assigned</p>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else class="text-center py-12">
          <div class="bg-error-soft p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="text-error text-lg font-semibold">Failed to load role details</p>
          <button @click="goBack" class="mt-4 px-4 py-2 text-primary font-semibold hover:underline transition-all">
            ← Return to roles list
          </button>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>
