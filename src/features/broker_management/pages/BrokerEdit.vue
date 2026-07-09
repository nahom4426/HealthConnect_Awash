<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBrokerStore } from '../stores/brokerStore';
import { updateBroker } from '../api/brokerApi';
import Input from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import Button from '@/components/Button.vue';

const route = useRoute();
const router = useRouter();
const store = useBrokerStore();
const brokerId = route.params.id;

const loading = ref(true);
const isSubmitting = ref(false);
const saveError = ref('');

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  licenseNumber: '',
  taxId: '',
  bankName: '',
  bankAccountNumber: '',
  type: 'BROKER',
  status: 'ACTIVE'
});

// Collapsible sections
const sections = ref({
  personal: true,
  address: true,
  professional: true,
  banking: true
});

const toggleSection = (section) => {
  sections.value[section] = !sections.value[section];
};

onMounted(async () => {
  try {
    const broker = await store.fetchBrokerById(brokerId);
    if (broker) {
      form.value = {
        firstName: broker.firstName || '',
        lastName: broker.lastName || '',
        email: broker.email || '',
        phoneNumber: broker.phoneNumber || '',
        address: broker.address || '',
        city: broker.city || '',
        state: broker.state || '',
        postalCode: broker.postalCode || '',
        licenseNumber: broker.licenseNumber || '',
        taxId: broker.taxId || '',
        bankName: broker.bankName || '',
        bankAccountNumber: broker.bankAccountNumber || '',
        type: broker.type || 'BROKER',
        status: broker.status || 'ACTIVE',
      };
    }
  } catch (err) {
    saveError.value = 'Failed to load broker details.';
  } finally {
    loading.value = false;
  }
});

const submitForm = async () => {
  isSubmitting.value = true;
  saveError.value = '';
  try {
    await updateBroker(brokerId, form.value);
    router.push(`/brokers/${brokerId}`);
  } catch (err) {
    saveError.value = err?.response?.data?.message || err.message || 'Failed to update broker.';
  } finally {
    isSubmitting.value = false;
  }
};

const cancel = () => {
  router.push(`/brokers/${brokerId}`);
};

const sectionConfig = [
  {
    key: 'personal',
    title: 'Personal Information',
    accent: 'border-l-blue-500',
    iconBg: 'bg-blue-50 text-blue-600',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    key: 'address',
    title: 'Address Information',
    accent: 'border-l-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    key: 'professional',
    title: 'Professional Details',
    accent: 'border-l-violet-500',
    iconBg: 'bg-violet-50 text-violet-600',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    key: 'banking',
    title: 'Payout Configuration',
    accent: 'border-l-amber-500',
    iconBg: 'bg-amber-50 text-amber-600',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
];
</script>

<template>
  <div class="p-6 h-full flex flex-col bg-gray-50 max-w-5xl mx-auto w-full">
    <!-- Page Header -->
    <div class="mb-6">
      <button @click="cancel" class="text-sm font-medium text-gray-400 hover:text-primary flex items-center mb-4 transition-colors gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Broker
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Edit Broker</h1>
      <p class="text-sm text-gray-400 mt-1">Update broker information and payout details.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm text-gray-400">Loading broker details...</span>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="saveError" class="mb-4 px-4 py-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2">
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      {{ saveError }}
    </div>

    <form v-if="!loading" @submit.prevent="submitForm" class="flex-1 flex flex-col gap-4 pb-24">

      <!-- Collapsible Section Template -->
      <div
        v-for="sec in sectionConfig"
        :key="sec.key"
        class="bg-white rounded-xl shadow-xs border-l-4 border-t border-r border-b border-gray-200 overflow-hidden transition-all duration-300"
        :class="sec.accent"
      >
        <!-- Section Header -->
        <button
          type="button"
          @click="toggleSection(sec.key)"
          class="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 select-none transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg" :class="sec.iconBg">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="sec.icon" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900">{{ sec.title }}</h3>
          </div>
          <svg class="h-5 w-5 text-gray-400 transition-transform duration-300" :class="{ 'rotate-180': sections[sec.key] }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Personal Information Fields -->
        <div v-if="sec.key === 'personal'" v-show="sections.personal" class="px-6 pb-6 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-4">
            <Input
              v-model="form.firstName"
              :attributes="{ placeholder: 'e.g. Abraham', name: 'firstName', label: 'First Name', required: true }"
            />
            <Input
              v-model="form.lastName"
              :attributes="{ placeholder: 'e.g. Tadesse', name: 'lastName', label: 'Last Name', required: true }"
            />
            <Input
              v-model="form.email"
              :attributes="{ placeholder: 'broker@example.com', name: 'email', type: 'email', label: 'Email Address', required: true }"
            />
            <Input
              v-model="form.phoneNumber"
              :attributes="{ placeholder: '+251 9XX XXX XXX', name: 'phoneNumber', label: 'Phone Number', required: true }"
            />
          </div>
        </div>

        <!-- Address Information Fields -->
        <div v-if="sec.key === 'address'" v-show="sections.address" class="px-6 pb-6 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <Input
                v-model="form.address"
                :attributes="{ placeholder: 'e.g. Bole Road', name: 'address', label: 'Street Address', required: true }"
              />
            </div>
            <Input
              v-model="form.city"
              :attributes="{ placeholder: 'e.g. Addis Ababa', name: 'city', label: 'City', required: true }"
            />
            <Input
              v-model="form.state"
              :attributes="{ placeholder: 'e.g. Addis Ababa', name: 'state', label: 'State/Region', required: true }"
            />
            <Input
              v-model="form.postalCode"
              :attributes="{ placeholder: 'e.g. 1000', name: 'postalCode', label: 'Postal Code' }"
            />
          </div>
        </div>

        <!-- Professional Details Fields -->
        <div v-if="sec.key === 'professional'" v-show="sections.professional" class="px-6 pb-6 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-4">
            <Input
              v-model="form.licenseNumber"
              :attributes="{ placeholder: 'e.g. BRK-2024-001', name: 'licenseNumber', label: 'License Number', required: true }"
            />
            <Input
              v-model="form.taxId"
              :attributes="{ placeholder: 'e.g. TIN-123456789', name: 'taxId', label: 'Tax ID', required: true }"
            />
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Broker Type</label>
              <Select
                name="type"
                :obj="true"
                :options="[{ value: 'BROKER', label: 'Broker' }, { value: 'AGENT', label: 'Agent' }]"
                :modelValue="form.type"
                @update:modelValue="v => form.type = v"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <Select
                name="status"
                :obj="true"
                :options="[{ value: 'ACTIVE', label: 'Active' }, { value: 'PENDING', label: 'Pending' }, { value: 'INACTIVE', label: 'Inactive' }]"
                :modelValue="form.status"
                @update:modelValue="v => form.status = v"
              />
            </div>
          </div>
        </div>

        <!-- Banking Fields -->
        <div v-if="sec.key === 'banking'" v-show="sections.banking" class="px-6 pb-6 pt-4 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-4">
            <Input
              v-model="form.bankName"
              :attributes="{ placeholder: 'e.g. Commercial Bank of Ethiopia', name: 'bankName', label: 'Bank Name', required: true }"
            />
            <Input
              v-model="form.bankAccountNumber"
              :attributes="{ placeholder: 'e.g. 1000XXXXXXX', name: 'bankAccountNumber', label: 'Account Number', required: true }"
            />
          </div>
        </div>
      </div>

      <!-- Fixed Action Bar -->
      <div class="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-8 py-4 z-10 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.04)]">
        <Button type="button" variant="outline" @click="cancel">Cancel</Button>
        <Button html-type="submit" variant="primary" :pending="isSubmitting">Update Broker</Button>
      </div>
    </form>
  </div>
</template>
