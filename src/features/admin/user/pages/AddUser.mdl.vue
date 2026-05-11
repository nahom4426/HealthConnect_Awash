<script setup >
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import UserForm from "./UserForm.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, onMounted } from "vue";
import { CreateUser } from "../Api/UserApi";
import { useUsers } from "../store/userStore";
import { useToast } from '@/toast/store/toast';
import { useApiRequest } from "@/composables/useApiRequest";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const modalData = ref(props.data || {});
const formPending = ref(false);
const error = ref('');
const userStore = useUsers();
const { addToast } = useToast();

onMounted(() => {
  console.log('AddUser modal received data:', modalData.value);
});

// Handle form submission
async function handleSubmit(formValues) {
  try {
    formPending.value = true;
    console.log('Form submitted with values:', formValues);
    
    // Make sure payerUuid is included
    const userData = {
      ...formValues,
      payerUuid: modalData.value.payerUuid || formValues.payerUuid
    };
    
    console.log('Submitting user data:', userData);
    
    const result = await CreateUser(userData);
    
    if (result.success) {
      console.log('User created successfully:', result.data);
      
      // Add the new user to the store
      userStore.add(result.data);
      
      addToast({
        type: 'success',
        title: 'Success',
        message: 'User created successfully'
      });
      
      // Call onUpdated callback if provided
      if (typeof modalData.value.onUpdated === 'function') {
        modalData.value.onUpdated(result.data);
      }
      
      closeModal();
    } else {
      throw new Error(result.error || 'Failed to create user');
    }
  } catch (error) {
    console.error('Error creating user:', error);
    
  } finally {
    formPending.value = false;
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent 
      class="max-w-4xl" 
      size="xl" 
      title="Create New User" 
      subtitle="Add a new user to the system by filling out the required information below."
    >
      <!-- Error Alert -->
      <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
      
      <UserForm
        :pending="formPending"
        :onSubmit="handleSubmit"
        :onCancel="() => closeModal()"
        :roleName="modalData.roleName"
        :payerUuid="modalData.payerUuid"
      />
    </NewFormParent>
  </ModalParent>
</template>
