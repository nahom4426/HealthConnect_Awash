<script setup>
import { ref, onMounted } from 'vue';
import { closeModal } from '@customizer/modal-x';
import ModalParent from '@/components/ModalParent.vue';
import NewFormParent from '../components/NewFormParent.vue';
import { getRoleById } from '../Api/RoleApi';
import { useApiRequest } from '@/composables/useApiRequest';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const roleUuid = props.data?.roleUuid;
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
</script>

<template>
  <ModalParent>
    <NewFormParent 
      class="" 
      size="lg" 
      title="Role Details" 
      subtitle="View role information and assigned privileges"
    >
      <div class="bg-white rounded-lg p-6">
        <div v-if="req.pending.value" class="p-4 text-center">
          Loading role details...
        </div>
        
        <div v-else-if="Object.keys(role).length > 0" class="space-y-6">
          <!-- Role Information -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <p class="text-gray-900 bg-gray-50 p-3 rounded-lg">{{ role.roleName }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role Description</label>
              <p class="text-gray-900 bg-gray-50 p-3 rounded-lg">{{ role.roleDescription }}</p>
            </div>
          </div>

          <!-- Privileges Section -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Assigned Privileges</label>
            <div v-if="role.privilegeList && role.privilegeList.length > 0" 
                 class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div v-for="privilege in role.privilegeList" 
                   :key="privilege.privileges"
                   class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 class="font-medium text-blue-900">{{ privilege.privilegeName }}</h4>
                <p class="text-sm text-blue-700 mt-1">{{ privilege.privilegeDescription }}</p>
              </div>
            </div>
            <div v-else class="text-gray-500 italic bg-gray-50 p-4 rounded-lg text-center">
              No privileges assigned to this role
            </div>
          </div>
        </div>

        <div v-else class="p-4 text-center text-red-600">
          Failed to load role details
        </div>

        <!-- Close Button -->
        <div class="flex justify-end mt-6 pt-4 border-t">
          <button 
            @click="closeModal()"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>