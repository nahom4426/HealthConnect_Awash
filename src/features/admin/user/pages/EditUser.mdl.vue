<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import UserForm from "./UserForm.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, onMounted, watch, computed } from "vue";
import { updateUserById, getUserById } from "../Api/UserApi";
import { useUsers } from "../store/userStore";
import { useApiRequest } from "@/composables/useApiRequest";
import { useToast } from '@/toast/store/toast';
import { institutions } from "../../../institutions/store/userInstitutionsStore";
import { refreshPrivileges } from "@/scripts/privilegeRefresh";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});
console.log("users receive:", props.data);

const { addToast } = useToast();
const userStore = useUsers();
const institutionsStore = institutions();
const req = useApiRequest();
const authStore = useAuthStore();

// Reactive state
const userUuid = ref(props.data?.userUuid || '');
const userData = ref(props.data?.user || {});
const pending = ref(false);
const error = ref('');

// Determine if this is a payer admin user
const isPayerAdmin = computed(() => {
  return props.data?.payerUuid && props.data?.roleName?.startsWith('PA_');
});

// Computed payer data for admin users
const payerData = computed(() => {
  if (!isPayerAdmin.value) return null;
  return institutionsStore.institutions.find(
    p => p.payerUuid === props.data?.payerUuid
  );
});

// Computed role name
const roleName = computed(() => {
  return props.data?.roleName || userData.value?.roleName || '';
});

onMounted(async () => {
  console.log('EditUser modal mounted with data:', props.data);
  
  if (props.data?.userUuid) {
    userUuid.value = props.data.userUuid;
    userData.value = props.data.user || {};
    
    // If we don't have complete user data, fetch it
    if (userUuid.value && Object.keys(userData.value).length === 0) {
      await fetchUserData();
    }
  }
});

watch(() => props.data, (newData) => {
  console.log('EditUser modal props updated:', newData);
  if (newData) {
    userUuid.value = newData.userUuid || '';
    userData.value = newData.user || {};
  }
}, { deep: true });

async function fetchUserData() {
  try {
    pending.value = true;
    error.value = '';
    
    req.send(
      () => getUserById(userUuid.value),
      (res) => {
        if (res.success) {
          userData.value = res.data;
          console.log('Fetched user data:', userData.value);
        } else {
          error.value = res.error || 'Failed to fetch user data';
          addToast({
            type: 'error',
            title: 'Error',
            message: error.value
          });
        }
      }
    );
  } catch (err) {
    error.value = err.message || 'An error occurred while fetching user data';
    addToast({
      type: 'error',
      title: 'Error',
      message: error.value
    });
  } finally {
    pending.value = false;
  }
}

async function handleSubmit(formValues) {
  try {
    pending.value = true;
    error.value = '';
    console.log('Updating user with values:', formValues);

    const payload = {
      email: formValues?.email,
      title: formValues?.title,
      firstName: formValues?.firstName,
      fatherName: formValues?.fatherName,
      grandFatherName: formValues?.grandFatherName,
      mobilePhone: formValues?.mobilePhone,
      userStatus: formValues?.userStatus,
      roleUuid: formValues?.roleUuid,
      gender: formValues?.gender
    };
    
    // Format gender to lowercase for API
    if (payload.gender) {
      payload.gender = payload.gender.toLowerCase();
    }

    req.send(
      () => updateUserById(userUuid.value, payload),
      async (res) => {
        if (res.success) {
          const updatedUser = {
            ...userData.value,
            ...formValues,
            userUuid: userUuid.value,
          };

          // Update the user in the store
          userStore.update(userUuid.value, updatedUser);
          
          // If this is a payer admin user, update the payer in institutions store
          if (isPayerAdmin.value && payerData.value) {
            const updatedUsers = payerData.value.users?.map(user => 
              user.userUuid === userUuid.value ? updatedUser : user
            ) || [];
            
            institutionsStore.update(props.data.payerUuid, {
              users: updatedUsers
            });
          }

          addToast({
            type: 'success',
            title: 'Success',
            message: 'User updated successfully'
          });

          if (authStore.auth?.user?.userUuid === userUuid.value) {
            await refreshPrivileges(userUuid.value);
          }

          // Call the onUpdated callback if provided
          if (props.data?.onUpdated) {
            props.data.onUpdated(updatedUser);
          }

          closeModal();
        } else {
          error.value = res.error || 'Failed to update user';
          addToast({
            type: 'error',
            title: 'Error',
            message: error.value
          });
        }
      }
    );
  } catch (err) {
    error.value = err.message || 'An error occurred while updating user';
    addToast({
      type: 'error',
      title: 'Error',
      message: error.value
    });
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent 
      class="max-w-4xl" 
      size="xl" 
      :title="`Edit ${userData.firstName || 'User'}`" 
      subtitle="Update the user information in the fields below."
    >
      <!-- Error Alert -->
      <div v-if="error" class="p-4 mb-6 bg-red-50 rounded-lg border border-red-200">
        <div class="flex items-center">
          <svg class="mr-3 w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="pending && Object.keys(userData).length === 0" class="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-center">
          <svg class="mr-3 w-5 h-5 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p class="text-sm text-blue-700">Loading user data...</p>
        </div>
      </div>
      
      <!-- User Form -->
      <UserForm
        v-if="Object.keys(userData).length > 0"
        :initial-data="userData"
        :is-edit="true"
        :pending="pending || req.pending.value"
        :role-name="userData?.roleUuid || roleName"
        :payer-uuid="props.data?.payerUuid"
        :onSubmit="handleSubmit"
        :onCancel="() => closeModal()"
      />
      
      <!-- No Data State -->
      <div v-else-if="!pending" class="p-8 text-center">
        <svg class="mx-auto mb-4 w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-gray-500">No user data available</p>
      </div>
    </NewFormParent>
  </ModalParent>
</template>