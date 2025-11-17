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
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-gray-500 text-white"
        @click="goBack"
      >
        <i v-html="icons.arrow_left"></i>
        <p class="text-base">Back to Roles</p>
      </button>
    </template>

    <template #default>
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div v-if="req.pending.value" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading role details...</p>
        </div>
        
        <div v-else-if="Object.keys(role).length > 0" class="space-y-8">
          <!-- Header -->
          <div class="border-b pb-4">
            <h1 class="text-2xl font-bold text-gray-900">{{ role.roleName }}</h1>
            <p class="text-gray-600 mt-1">Role Details</p>
          </div>

          <!-- Role Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
              <div class="bg-gray-50 p-4 rounded-lg border">
                <p class="text-gray-900 font-medium">{{role.roleName }}</p>
              </div>
            </div>
            <!-- <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Role Description</label>
              <div class="bg-gray-50 p-4 rounded-lg border">
                <p class="text-gray-900">{{ role.roleDescription }}</p>
              </div>
            </div> -->
          </div>

          <!-- Privileges Section -->
          <div>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Assigned Privileges</h2>
            <div v-if="role.privilegeList && role.privilegeList.length > 0" 
                 class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="privilege in role.privilegeList" 
                   :key="privilege.privilegeUuid"
                   class="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start gap-3">
                  <div class="bg-blue-100 p-2 rounded-full">
                    <i v-html="icons.shield || icons.check" class="text-blue-600"></i>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-medium text-blue-900">{{ privilege.privilegeName }}</h4>
                    <p class="text-sm text-blue-700 mt-1">{{ privilege.privilegeDescription }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-12">
              <div class="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <i v-html="icons.info || icons.warning" class="text-gray-400"></i>
              </div>
              <p class="text-gray-500 text-lg">No privileges assigned to this role</p>
              <p class="text-gray-400 text-sm mt-1">This role currently has no privileges assigned</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <div class="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i v-html="icons.error || icons.warning" class="text-red-400"></i>
          </div>
          <p class="text-red-600 text-lg">Failed to load role details</p>
          <button @click="goBack" class="mt-4 text-primary hover:underline">
            Return to roles list
          </button>
        </div>
      </div>
    </template>
  </DefaultPage>
</template>
