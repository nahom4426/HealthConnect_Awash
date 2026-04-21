<script setup>
import { ref, computed, onMounted } from 'vue';
import Input from '@/components/new_form_elements/Input.vue';
import InputPassword from '@/components/new_form_elements/InputPassword.vue';
import Select from '@/components/new_form_elements/Select.vue';
import Form from '@/components/new_form_builder/Form.vue';
import { getAllRole } from '../../role/Api/RoleApi';
import Spinner from '@/components/Spinner.vue';
import InputLayout from '@/components/new_form_elements/NewInputLayout.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  pending: {
    type: Boolean,
    default: false
  },
  onSubmit: {
    type: Function,
    required: true
  },
  onCancel: {
    type: Function,
    required: true
  },
  roleName: {
    type: String,
    default: ''
  },
  payerUuid: {
    type: String,
    default: ''
  }
});

// Create a computed property to handle the pending state
const isPending = computed(() => {
  return props.pending || fetchRolesPending.value;
});

// Add a ref for the form element
const formEl = ref(null);

// Form data
const email = ref('');
const password = ref('');
const title = ref('');
const firstName = ref('');
const fatherName = ref('');
const grandFatherName = ref('');
const gender = ref('');
const mobilePhone = ref('');
const userStatus = ref('');
const roleUuid = ref('');

function normalizeEthiopianMobile(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return '';

  const compact = raw.replace(/[\s-]/g, '');
  let local = compact;

  if (local.startsWith('+251')) local = local.slice(4);
  if (local.startsWith('251')) local = local.slice(3);
  if (local.startsWith('0')) local = local.slice(1);

  if (!/^[13789]\d{8}$/.test(local)) return raw;
  return `+251${local}`;
}

// Role fetching state
const roles = ref([]);
const fetchRolesPending = ref(false);
const rolesError = ref(null);

// Role options computation
const roleOptions = computed(() => {
  if (!roles.value) return [];
  
  const rolesArray = roles.value.content || roles.value;
  
  if (!Array.isArray(rolesArray)) {
    console.error('Roles is not an array:', roles.value);
    return [];
  }
  
  return rolesArray.map(role => ({
    label: role.roleName,
    value: role.roleUuid
  }));
});

// Fetch roles function
async function fetchRoles() {
  console.log('Fetching roles, looking for:', props.roleName);
  fetchRolesPending.value = true;
  
  try {
    const response = await getAllRole();
    
    if (response.success) {
      roles.value = response.data || [];
      console.log('Fetched roles:', roles.value);
      
      if (props.roleName) {
        console.log('Looking for role with identifier:', props.roleName);
        const rolesArray = roles.value.content || roles.value;
        
        if (!Array.isArray(rolesArray)) {
          console.error('Roles is not an array:', roles.value);
          return;
        }
        
        let matchingRole = rolesArray.find(role => role.roleUuid === props.roleName);
        if (!matchingRole) {
          matchingRole = rolesArray.find(role => role.roleName === props.roleName);
        }
        if (!matchingRole) {
          const normalizedRoleName = String(props.roleName).toLowerCase();
          matchingRole = rolesArray.find(role => role.roleName && String(role.roleName).toLowerCase() === normalizedRoleName);
        }
        
        if (matchingRole) {
          console.log('Found matching role:', matchingRole);
          roleUuid.value = matchingRole.roleUuid;
        } else {
          console.log('No matching role found for:', props.roleName);
          console.log('Available roles:', rolesArray.map(r => `${r.roleName} (${r.roleUuid})`).join(', '));
        }
      }
    } else {
      console.error('Failed to fetch roles:', response.error);
    }
  } catch (error) {
    console.error('Error fetching roles:', error);
  } finally {
    fetchRolesPending.value = false;
  }
}

// Title options
const titleOptions = [
  'Mr',
  'Ms.',
  'Mrs.',
  'Miss',
  'Mx.',
  'Dr.',
  'Prof.',
  'Eng.',
  'Atty.'
];

const genderOptions = ['Female', 'Male'];
const userStatusOptions = ['ACTIVE', 'SUSPENDED','PENDING'];

// Initialize form data
onMounted(async () => {
  console.log('UserForm props:', {
    initialData: props.initialData,
    isEdit: props.isEdit,
    roleName: props.roleName
  });

  await fetchRoles();

  if (props.initialData && Object.keys(props.initialData).length > 0) {
    email.value = props.initialData.email || '';
    password.value = '';
    title.value = props.initialData.title || '';
    firstName.value = props.initialData.firstName || '';
    fatherName.value = props.initialData.fatherName || '';
    grandFatherName.value = props.initialData.grandFatherName || '';
    
    if (props.initialData.gender) {
      gender.value = props.initialData.gender.charAt(0).toUpperCase() + props.initialData.gender.slice(1).toLowerCase();
    }
    mobilePhone.value = props.initialData.mobilePhone || '';
    userStatus.value = props.initialData.userStatus || '';
    
    if (props.initialData.roleUuid) {
      roleUuid.value = props.initialData.roleUuid;
    } else if (props.initialData.roleName && roles.value) {
      const rolesArray = roles.value.content || roles.value;
      
      if (Array.isArray(rolesArray)) {
        const matchingRole = rolesArray.find(role => role.roleName === props.initialData.roleName);
        
        if (matchingRole) {
          roleUuid.value = matchingRole.roleUuid;
          console.log('Found matching role by name:', matchingRole);
        }
      }
    }
  } else {
    if (!props.isEdit && !mobilePhone.value) {
      mobilePhone.value = '+251';
    }
  }
});

function handleSubmit() {
  const formData = {
    email: email.value,
    title: title.value,
    firstName: firstName.value,
    fatherName: fatherName.value,
    grandFatherName: grandFatherName.value,
    gender: gender.value,
    mobilePhone: normalizeEthiopianMobile(mobilePhone.value),
    userStatus: userStatus.value,
    roleUuid: roleUuid.value
  };

  if (!props.isEdit) {
    formData.password = password.value;
  }

  props.onSubmit(formData);
}
</script>

<template>
  <div class="bg-white rounded-xl border border-gray-100 shadow-sm">
    <Form 
      ref="formEl"
      :inner="true" 
      class="p-4 sm:p-6 lg:p-8" 
      id="user-form"
      v-slot="{ submit }"
    >
      <!-- Form Header -->
      <div class="mb-6 sm:mb-8">
        <h3 class="mb-2 text-base font-semibold text-gray-900 sm:text-lg">
          {{ isEdit ? 'Update User Information' : 'Create New User' }}
        </h3>
        <p class="text-sm text-gray-600">
          {{ isEdit ? 'Modify the user details below.' : 'Fill in the required information to create a new user account.' }}
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        <!-- Email -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Email <span class="text-red-500">*</span>
          </label>
          <Input
            v-model="email"
            name="email"
            validation="required|email"
            :attributes="{
              placeholder: 'Enter user email',
              required: true
            }"
          />
        </div>

        <!-- Password (Create only) -->
        <div v-if="!isEdit" class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Password <span class="text-red-500">*</span>
          </label>
          <InputPassword
            v-model="password"
            name="password"
            validation="required"
            :attributes="{
              placeholder: 'Enter password',
              required: true,
              autocomplete: 'new-password'
            }"
          />
        </div>

        <!-- Title -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Title <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="title"
            name="title"
            validation="required"
            :options="titleOptions"
            :attributes="{
              placeholder: 'Select title',
              required: true
            }"
          />
        </div>

        <!-- First Name -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            First Name <span class="text-red-500">*</span>
          </label>
          <Input
            v-model="firstName"
            name="firstName"
            validation="required|alpha"
            :attributes="{
              placeholder: 'Enter first name',
              required: true
            }"
          />
        </div>

        <!-- Father Name -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Father Name <span class="text-red-500">*</span>
          </label>
          <Input
            v-model="fatherName"
            name="fatherName"
            validation="required|alpha"
            :attributes="{
              placeholder: 'Enter father name',
              required: true
            }"
          />
        </div>

        <!-- Grandfather Name -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Grandfather Name <span class="text-red-500">*</span>
          </label>
          <Input
            v-model="grandFatherName"
            name="grandFatherName"
            validation="required|alpha"
            :attributes="{
              placeholder: 'Enter grandfather name',
              required: true
            }"
          />
        </div>

        <!-- Gender -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Gender <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="gender"
            name="gender"
            validation="required"
            :options="genderOptions"
            :attributes="{
              placeholder: 'Select gender',
              required: true
            }"
          />
        </div>

        <!-- Mobile Phone -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Mobile Phone <span class="text-red-500">*</span>
          </label>
          <Input
            v-model="mobilePhone"
            name="mobilePhone"
            validation="required|eth_mobile9"
            :attributes="{
              placeholder: 'Enter mobile phone',
              required: true,
              inputmode: 'numeric',
              autocomplete: 'tel'
            }"
          />
        </div>

        <!-- Role -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            Role <span class="text-red-500">*</span>
          </label>
          <InputLayout>
            <select
            v-model="roleUuid"
            name="roleUuid"
              required
              class="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                {{ roleOptions.length ? 'Select role' : 'No roles available' }}
              </option>
              <option
                v-for="option in roleOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </InputLayout>
        </div>

        <!-- User Status -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">
            User Status <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="userStatus"
            name="userStatus"
            validation="required"
            :options="userStatusOptions"
            :attributes="{
              placeholder: 'Select status',
              required: true
            }"
          />
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex flex-col-reverse gap-3 justify-end pt-4 mt-6 border-t border-gray-200 sm:mt-8 sm:pt-6 sm:flex-row">
        <button
          type="button"
          @click="onCancel"
          class="px-4 py-2.5 w-full text-sm text-gray-700 bg-white rounded-lg border border-gray-300 transition-colors sm:w-auto sm:px-6 hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 sm:text-base"
          :disabled="isPending"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="submit(() => handleSubmit())"
          class="flex gap-2 justify-center items-center px-4 py-2.5 w-full text-sm text-white bg-blue-600 rounded-lg transition-colors sm:w-auto sm:px-6 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 sm:text-base"
          :disabled="isPending"
        >
          <svg v-if="isPending" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ isEdit ? 'Update User' : 'Create User' }}
        </button>
      </div>
    </Form>
  </div>
</template>

<style scoped>
/* Additional styling for the form */
:deep(.form-control) {
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  color: #111827;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  display: block;
  width: 100%;
  padding: 0.625rem;
}

:deep(.form-control:focus) {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: #3b82f6;
}

:deep(.form-select) {
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  color: #111827;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  display: block;
  width: 100%;
  padding: 0.625rem;
}

:deep(.form-select:focus) {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: #3b82f6;
}
</style>