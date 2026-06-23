<script setup>
import { ref, reactive, computed, watch } from 'vue';
import Button from '@/components/Button.vue';
import EmployeeTable from './EmployeeTable.vue';
import { getActiveInstitutions } from '@/features/institutions/api/institutionApi';
import { getInstitutionContracts } from '@/features/underwriting/api/underwritingApi';
import { searchActiveInsuredByContract } from '@/features/insured_persons/api/insuredPersonsApi';

// Format profile image source to handle both URLs and base64
const formatImageSource = (profile) => {
  if (!profile) return '';
  
  // Check if it's a base64 string (starts with iVBOR for PNG or /9j/ for JPEG)
  const isBase64 = profile.startsWith('iVBOR') || profile.startsWith('/9j/');
  
  // If it's base64, add the data URL prefix, otherwise return as is
  return isBase64 ? `data:image/png;base64,${profile}` : profile;
};

const emit = defineEmits(['complete']);

// Props
const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {}
  }
});

// Tab state
const activeTab = ref('select');

// Institution search state
const institutionSearchTerm = ref('');
const showInstitutionDropdown = ref(false);
const institutions = ref([]);
const institutionLoading = ref(false);
const institutionUuid = ref('');
const selectedContract = ref(null);
const contracts = ref([]);
const contractLoading = ref(false);
const selectedInstitution = ref(null);

// Employee search state
const employeeSearchTerm = ref('');
const employees = ref([]);
const employeeLoading = ref(false);
const error = ref(null);
const selectedEmployee = ref(null);
const employeeDetails = ref(null);

const selectedInsured = reactive({
  insuredUuid: '',
  dependantUuid: null,
  name: '',
  idNumber: '',
  phone: '',
  gender: '',
  profile: '',
  __dependants: []
});

const canContinue = computed(() => !!(institutionUuid.value && selectedContract.value && selectedInsured.insuredUuid));

function resetSelectedInsured() {
  Object.assign(selectedInsured, {
    insuredUuid: '',
    dependantUuid: null,
    name: '',
    idNumber: '',
    phone: '',
    gender: '',
    profile: '',
    __dependants: []
  });
}

function resetEmployeeState() {
  employeeSearchTerm.value = '';
  employees.value = [];
  error.value = null;
  selectedEmployee.value = null;
  employeeDetails.value = null;
  resetSelectedInsured();
}

function normalizeContractsResponse(res) {
  const raw = res?.data ?? res;

  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(res?.content)) return res.content;

  return [];
}

// Load institutions on mount
async function loadInstitutions({ page = 0, limit = 500000, search = '', status = 'ACTIVE' } = {}) {
  institutionLoading.value = true;
  try {
    const res = await getActiveInstitutions({ page, limit, search, status });
    // Handle paginated data (assuming API returns { content, totalElements, etc. })
    institutions.value = res?.data?.content || res?.content || res?.data || res || [];
  } catch (error) {
    console.error('Error loading institutions:', error);
    institutions.value = [];
  } finally {
    institutionLoading.value = false;
  }
}

// Filtered institutions based on search
const filteredInstitutions = computed(() => {
  if (!institutionSearchTerm.value) return institutions.value;
  return institutions.value.filter(inst =>
    inst.institutionName?.toLowerCase().includes(institutionSearchTerm.value.toLowerCase())
  );
});

// Select institution
async function selectInstitution(inst) {
  institutionUuid.value = inst.institutionUuid;
  institutionSearchTerm.value = inst.institutionName;
  showInstitutionDropdown.value = false;
  selectedContract.value = null;
  contracts.value = [];
  selectedInstitution.value = inst;
  resetEmployeeState();
  
  // Load contract
  contractLoading.value = true;
  try {
    const res = await getInstitutionContracts(inst.institutionUuid, {
      status: 'ACTIVE'
    });
    const arr = normalizeContractsResponse(res);
    contracts.value = arr;
    if (arr.length === 1) {
      selectedContract.value = arr[0];
    }
  } catch (error) {
    console.error('Error loading contracts:', error);
    contracts.value = [];
  }
  finally {
    contractLoading.value = false;
  }
}

function handleContractChange(contractUuid) {
  selectedContract.value = contracts.value.find(
    (contract) => contract.payerInstitutionContractUuid === contractUuid
  ) || null;
  resetEmployeeState();
}

// Load employees with error handling
async function loadEmployees() {
  if (!institutionUuid.value || !selectedContract.value?.payerInstitutionContractUuid || !employeeSearchTerm.value) {
    employees.value = [];
    error.value = null;
    return;
  }
  
  employeeLoading.value = true;
  error.value = null;
  try {
    const res = await searchActiveInsuredByContract(selectedContract.value.payerInstitutionContractUuid, {
      search: employeeSearchTerm.value,
    });
    console.log('=== API Response ===');
    console.log('Full response:', res);
    console.log('res?.content:', res?.content);
    console.log('res?.data:', res?.data);
    console.log('res type:', typeof res);
    console.log('res is array:', Array.isArray(res));
    
    const raw = res?.content || res?.data || res || [];
    const list = Array.isArray(raw) ? raw : [];

    // Normalize dependants list from API (dependantResponses) into __dependants for the table
    // Also ensure dependants have insuredUuid so selection works consistently.
    employees.value = list.map((emp) => {
      const deps = Array.isArray(emp?.dependantResponses)
        ? emp.dependantResponses
        : (emp?.__dependants || []);

      const normalizedDeps = (Array.isArray(deps) ? deps : []).map((d) => ({
        ...d,
        insuredUuid: emp?.insuredUuid,
        phone: d?.phone ?? emp?.phone,
        profile: d?.profile ?? d?.profilePicture ?? null,
      }));

      return {
        ...emp,
        __dependants: normalizedDeps,
      };
    });
    
    console.log('Employees assigned:', employees.value);
    console.log('Employees length:', employees.value.length);
    
    // If no employees found, set error (without retry action)
    if (!employees.value || employees.value.length === 0) {
      error.value = {
        message: 'No employees found',
        details: `No matching employees found for "${employeeSearchTerm.value}". Try a different search term.`,
        action: null
      };
    }
    
  } catch (err) {
    console.error('=== ERROR CAUGHT ===');
    console.error('Error object:', err);
    console.error('Error message:', err?.message);
    console.error('Error response:', err?.response);
    console.error('Error response data:', err?.response?.data);
    console.error('Error toString:', err?.toString());
    
    employees.value = [];
    error.value = {
      message: 'Failed to load employees',
      details: err?.response?.data?.message || err?.message || 'Network error or server unavailable. Please check your connection.',
      action: loadEmployees
    };
  } finally {
    employeeLoading.value = false;
  }
}

// Filtered employees
const filteredEmployees = computed(() => employees.value);

// Select employee or dependant from table
function handleSelectEmployee(emp) {
  if (emp.dependantUuid) {
    // It's a dependant
    Object.assign(selectedInsured, {
      insuredUuid: emp.insuredUuid,
      dependantUuid: emp.dependantUuid,
      name: emp.firstName + ' ' + (emp.fatherName || '') + ' ' + (emp.grandFatherName || ''),
      idNumber: emp.idNumber,
      phone: emp.phone,
      gender: emp.gender,
      profile: emp.profile,
    });
  } else {
    // It's an employee
    Object.assign(selectedInsured, {
      insuredUuid: emp.insuredUuid,
      dependantUuid: null,
      name: emp.firstName + ' ' + (emp.fatherName || '') + ' ' + (emp.grandFatherName || ''),
      idNumber: emp.idNumber,
      phone: emp.phone,
      gender: emp.gender,
      profile: emp.profile,
    });
    selectedInsured.__dependants = emp.__dependants || [];
  }
  selectedEmployee.value = emp;
  employeeDetails.value = emp;
  
  // Auto-navigate to Employee Details tab after selection
  activeTab.value = 'employee-details';
}

// Tab navigation functions
function goToSelect() {
  activeTab.value = 'select';
}

function goToEmployeeDetails() {
  if (selectedEmployee.value) {
    activeTab.value = 'employee-details';
  }
}

function finish() {
  if (!selectedEmployee.value) return;
  emit('complete', {
    institutionUuid: institutionUuid.value,
    institutionName: institutionSearchTerm.value,
    payerInstitutionContractUuid: selectedContract.value?.payerInstitutionContractUuid,
    cashPeriodLimitPerDay:
      selectedContract.value?.cashPeriodLimitPerDay ??
      selectedInstitution.value?.cashPeriodLimitPerDay,
    insuredUuid: selectedInsured.insuredUuid,
    dependantUuid: selectedInsured.dependantUuid,
    person: { 
      name: selectedInsured.name, 
      gender: selectedInsured.gender,
      profile: selectedInsured.profile,
      firstName: selectedInsured.firstName
    }
  });
}

function resetForNextPerson() {
  resetEmployeeState();

  activeTab.value = 'select';
}

defineExpose({ resetForNextPerson });

// Load institutions on mount
loadInstitutions();

// Watch employee search
watch(employeeSearchTerm, () => {
  // keep responsive search while typing (table selection is the source of truth)
  loadEmployees();
});
</script>

<template>
  <div class="space-y-4">
    <!-- Tabs Navigation -->
    <div class="flex gap-2 border-b border-gray-200">
      <button
        @click="activeTab = 'select'"
        :class="[
          'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
          activeTab === 'select'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-600 hover:text-gray-900'
        ]"
      >
        Select Employee
      </button>
      <button
        @click="activeTab = 'employee-details'"
        :disabled="!selectedEmployee"
        :class="[
          'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
          activeTab === 'employee-details'
            ? 'border-primary text-primary'
            : selectedEmployee
            ? 'border-transparent text-gray-600 hover:text-gray-900'
            : 'border-transparent text-gray-400 cursor-not-allowed'
        ]"
      >
        Employee Details
      </button>
    </div>

    <!-- Select Employee Tab -->
    <div v-if="activeTab === 'select'" class="space-y-6">
      <!-- Enhanced Error Message with Try Again -->
      <div v-if="error" class="flex justify-between items-start p-4 mb-4 rounded-lg" :class="typeof error === 'object' ? 'bg-yellow-50 border border-red-200' : 'bg-blue-50 border border-blue-200'">
        <div class="flex items-start">
          <svg v-if="typeof error === 'object'" class="flex-shrink-0 mt-0.5 mr-3 w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <svg v-else class="flex-shrink-0 mt-0.5 mr-3 w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class="font-medium" :class="typeof error === 'object' ? 'text-red-800' : 'text-blue-800'">
              {{ typeof error === 'object' ? error.message : error }}
            </h3>
            <div class="mt-1 text-sm" :class="typeof error === 'object' ? 'text-red-700' : 'text-blue-700'">
              <!-- <p v-if="typeof error === 'object'">Please check your network connection and try again.</p> -->
            </div>
          </div>
        </div>
        <button v-if="typeof error === 'object' && error.action" @click="error.action()"
          class="px-3 py-1 ml-4 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
          Try Again
        </button>
      </div>

      <!-- Search and Filter Section -->
     <div class="p-6 bg-white rounded-2xl border border-gray-100 shadow-lg">
  <div class="flex flex-wrap gap-5 items-end">
    <!-- Institution Search -->
    <div class="w-4/5 md:w-64 shrink-0">
      <label class="block mb-2.5 text-sm font-semibold text-gray-700">
        <span class="inline-flex gap-2 items-center">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Select Institution
        </span>
      </label>
      <div class="relative">
        <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="institutionSearchTerm"
          type="text"
          placeholder="Search institutions..."
          @focus="showInstitutionDropdown = true"
          @blur="setTimeout(() => showInstitutionDropdown = false, 200)"
          class="py-2.5 pr-10 pl-10 w-3/4 text-sm bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
        />
        <button
          v-if="institutionSearchTerm"
          @click="institutionSearchTerm = ''; institutionUuid = ''; selectedInstitution = null; selectedContract = null; contracts = []; resetEmployeeState()"
          class="absolute right-3 top-1/2 p-0.5 text-gray-400 rounded-full transition-colors transform -translate-y-1/2 hover:text-gray-600 hover:bg-gray-100"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div v-if="institutionLoading" class="absolute right-10 top-1/2 transform -translate-y-1/2">
          <svg class="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        <div 
          v-if="showInstitutionDropdown && filteredInstitutions.length > 0"
          class="overflow-y-auto absolute z-50 mt-2 w-full max-h-60 bg-white rounded-lg border border-gray-200 shadow-xl"
        >
          <div
            v-for="inst in filteredInstitutions"
            :key="inst.institutionUuid"
            @mousedown.prevent="selectInstitution(inst)"
            class="px-4 py-3 border-b border-gray-100 transition-all cursor-pointer hover:bg-blue-50 last:border-b-0"
            :class="{ 'bg-blue-50 border-l-4 border-l-blue-500': institutionUuid === inst.institutionUuid }"
          >
            <div class="text-sm font-medium text-gray-900">{{ inst.institutionName }}</div>
            <div class="flex gap-1 items-center mt-1 text-xs text-gray-500">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ inst.email || 'No email' }}
            </div>
          </div>
        </div>
        
        <div 
          v-else-if="showInstitutionDropdown && institutionSearchTerm && filteredInstitutions.length === 0"
          class="absolute z-50 p-4 mt-2 w-full bg-white rounded-lg border border-gray-200 shadow-xl"
        >
          <div class="flex gap-2 justify-center items-center text-sm text-center text-gray-400">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No institutions found
          </div>
        </div>
      </div>
    </div>

    <!-- Policy Selector -->
    <div v-if="contracts.length > 1" class="w-4/5 md:w-64 shrink-0">
      <label class="block mb-2.5 ml-2 text-sm font-semibold text-gray-700">
        <span class="inline-flex gap-2 items-center">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Select Policy
        </span>
      </label>
      <div class="relative">
        <select
          :value="selectedContract?.payerInstitutionContractUuid || ''"
          @change="handleContractChange($event.target.value)"
          class="py-2.5 pr-10 pl-3 ml-2 w-4/5 text-sm bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white"
        >
          <option value="" disabled>-- Select a policy --</option>
          <option
            v-for="contract in contracts"
            :key="contract.payerInstitutionContractUuid"
            :value="contract.payerInstitutionContractUuid"
          >
            {{ contract.contractName || contract.contractCode || contract.policyNumber }}
          </option>
        </select>
        <div class="flex absolute inset-y-0 right-0 items-center pr-3 pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div v-if="contractLoading" class="absolute right-10 top-1/2 text-purple-600 transform -translate-y-1/2">
          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Employee Search -->
    <div class="w-4/5 min-w-0 md:flex-1">
      <label class="block mb-2.5 ml-2 text-sm font-semibold text-gray-700">
        <span class="inline-flex gap-2 items-center">
          <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Search Employees
        </span>
      </label>
      <div class="relative">
        <div class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="employeeSearchTerm"
          type="text"
          placeholder="Search by name, ID, or insurance number..."
          :disabled="!selectedContract"
          class="py-2.5 pr-10 pl-10 ml-2 w-[90%] text-sm bg-gray-50 rounded-lg border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-75"
        />
        <button
          v-if="employeeSearchTerm"
          @click="employeeSearchTerm = ''; employees = []; selectedInsured.insuredUuid = ''; error = null"
          class="absolute right-3 top-1/2 p-0.5 text-gray-400 rounded-full transition-colors transform -translate-y-1/2 hover:text-gray-600 hover:bg-gray-100"
          :disabled="!selectedContract"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <div v-if="employeeLoading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg class="w-4 h-4 text-green-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</div>

      <!-- Results Summary Card -->
      <div v-if="!employeeLoading && employees.length > 0" class="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-blue-100 rounded-full">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-900">
                Top {{ employees.length }} {{ employees.length === 1 ? 'employee' : 'employees' }}
              </h3>
              <p class="text-xs text-gray-500">
                {{ employeeSearchTerm ? `Filtered by: "${employeeSearchTerm}"` : 'Showing eligible employees' }}
              </p>
              <p v-if="selectedContract?.policyNumber" class="mt-1 text-xs text-slate-500">
                Policy: {{ selectedContract.policyNumber }}
              </p>
            </div>
          </div>
          <button v-if="employeeSearchTerm" @click="employeeSearchTerm = ''"
            class="flex items-center text-xs text-blue-600 hover:text-blue-800">
            Clear search
            <svg class="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <template v-if="employeeLoading">
        <div class="flex flex-col justify-center items-center py-12 space-y-4">
          <div class="relative">
            <div class="w-12 h-12 rounded-full border-b-2 animate-spin border-primary"></div>
            <div class="absolute inset-0 w-12 h-12 rounded-full border-t-2 border-blue-200 animate-pulse"></div>
          </div>
          <div class="text-center">
            <p class="text-lg font-medium text-gray-700">Loading employees...</p>
            <p class="text-sm text-gray-500 animate-pulse">
              {{ employeeSearchTerm ? 'Searching for matching records' : 'Fetching eligible members' }}
            </p>
          </div>
        </div>
      </template>

      <!-- Employee Table Component -->
      <EmployeeTable
        :employees="filteredEmployees"
        :selectedEmployee="selectedInsured"
        :searchEmployeeQuery="employeeSearchTerm"
        @select-employee="handleSelectEmployee"
        @clear-search="employeeSearchTerm = ''"
      />

      <div v-if="selectedEmployee" class="flex justify-end px-6 pt-4 space-x-4 border-t border-gray-200">
        <Button type="button" @click="goToSelect"
          class="px-6 py-2 text-gray-600 rounded-md border border-gray-300 hover:bg-gray-50" :disabled="employeeLoading">
          Cancel
        </Button>
        <button type="button" class="flex items-center px-6 py-2 text-white rounded-md bg-primary hover:bg-teal-700"
          @click="goToEmployeeDetails">
          View Details
          <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Employee Details Tab - Modern ID Card -->
    <div v-else-if="activeTab === 'employee-details' && employeeDetails" class="space-y-6">
      <!-- Modern ID Card - White Background -->
      <div class="mx-auto max-w-10xl">
        <div class="overflow-hidden relative bg-white rounded-3xl border border-gray-100 shadow-xl">
          <!-- Decorative Top Bar -->
          <div class="h-2 bg-gradient-to-r from-blue-500 via-teal-500 to-blue-600"></div>

        <!-- Modern Employee ID Card -->
<!-- SECURE ID CARD -->
<div class="overflow-hidden relative p-8 bg-white rounded-3xl border border-gray-300 shadow-xl">

<!-- Security Background Pattern -->
<div class="absolute inset-0 opacity-[0.08] pointer-events-none"
     style="background-image: repeating-linear-gradient(45deg, #0ea5e9 0, #0ea5e9 1px, transparent 1px, transparent 8px);">
</div>

<!-- UV Watermark -->
<div class="absolute right-10 top-10 opacity-[0.06] pointer-events-none select-none text-[110px] font-extrabold uppercase"
     style="transform: rotate(-20deg);">
  {{ employeeDetails.firstName?.charAt(0) }}
</div>

<!-- Hologram Seal -->
<div class="absolute bottom-6 right-6 w-20 h-20 bg-gradient-to-br from-cyan-300 to-blue-600 rounded-full opacity-40 blur-[1px] pointer-events-none">
</div>

<!-- Micro-text (security line) -->
<div class="absolute left-0 right-0 top-0 text-[6px] tracking-[2px] uppercase text-gray-400 text-center py-1">
  {{ employeeDetails.firstName }} {{ employeeDetails.fatherName }} • EMPLOYEE ID • VALID • SECURE • VERIFIED
</div>

<!-- REAL CONTENT (unchanged structure) -->
<div class="relative z-10">
  <!-- Header -->
  <div class="flex justify-between items-start pb-6 mb-8 border-b border-gray-300">
    <div>
      <div class="flex gap-2 items-center mb-2">
        <div class="flex justify-center items-center w-10 h-10 bg-blue-600 rounded-lg shadow-md">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-sm font-bold text-gray-900">Employee ID Card</p>
      </div>
      <p class="font-mono text-xs text-gray-600">{{ employeeDetails.institutionUuid }}</p>
    </div>

    <div class="text-right">
      <p class="text-xs tracking-wide text-gray-500 uppercase">Valid Until</p>
      <p class="text-xl font-bold text-gray-900">{{ new Date(employeeDetails.endDate).toLocaleDateString() }}</p>
    </div>
  </div>

  <!-- GRID (same structure) -->
  <div class="grid grid-cols-4 gap-8">

    <!-- PHOTO SECTION -->
    <div class="flex flex-col col-span-1 items-center">

      <div class="relative mb-4 w-full">
        <!-- Photo -->
        <div v-if="employeeDetails.profile"
             class="overflow-hidden w-full rounded-2xl border-4 border-white shadow-lg aspect-square">
          <img :src="formatImageSource(employeeDetails.profile)" class="object-cover w-full h-full" />
        </div>

        <!-- Initial box -->
        <div v-else
          class="flex justify-center items-center w-full text-5xl font-bold text-white bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl border-4 border-white shadow-lg aspect-square">
          {{ employeeDetails.firstName?.charAt(0)?.toUpperCase() }}
        </div>

        <!-- Hologram strip -->
        <div class="absolute bottom-2 left-1/2 w-16 h-16 bg-gradient-to-tr from-blue-200 to-teal-400 rounded-full opacity-50 blur-md -translate-x-1/2">
        </div>
      </div>

    
    </div>

    <!-- DETAILS SECTION -->
    <div class="col-span-3 space-y-6">

      <!-- Name -->
      <div class="pb-4 border-b border-gray-300">
        <p class="mb-1 text-[10px] tracking-wider text-gray-500 uppercase font-semibold">Full Name</p>
        <p class="text-2xl font-bold text-gray-900">
          {{ employeeDetails.firstName }} {{ employeeDetails.fatherName || '' }}
        </p>
        <p class="text-sm text-gray-600">{{ employeeDetails.grandFatherName || '' }}</p>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-3 gap-5">

        <div class="p-4 rounded-xl border border-gray-300 shadow-sm backdrop-blur-sm bg-white/70">
          <p class="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Phone</p>
          <p class="mt-1 font-semibold text-gray-900">{{ employeeDetails.phone || 'N/A' }}</p>
        </div>

        <div class="p-4 rounded-xl border border-gray-300 shadow-sm backdrop-blur-sm bg-white/70">
          <p class="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Gender</p>
          <p class="mt-1 font-semibold text-gray-900 capitalize">{{ employeeDetails.gender || 'N/A' }}</p>
        </div>

        <div class="p-4 rounded-xl border border-gray-300 shadow-sm backdrop-blur-sm bg-white/70">
          <p class="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Status</p>
          <p class="mt-1 font-semibold text-gray-900">{{ employeeDetails.status }}</p>
        </div>

        <div class="p-4 rounded-xl border border-gray-300 shadow-sm backdrop-blur-sm bg-white/70">
          <p class="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Birth Date</p>
          <p class="mt-1 font-semibold text-gray-900">
            {{ new Date(employeeDetails.birthDate).toLocaleDateString() }}
          </p>
        </div>

        <div class="p-4 rounded-xl border border-gray-300 shadow-sm backdrop-blur-sm bg-white/70">
          <p class="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Valid From</p>
          <p class="mt-1 font-semibold text-gray-900">
            {{ new Date(employeeDetails.beginDate).toLocaleDateString() }}
          </p>
        </div>

        <div class="p-4 rounded-xl border border-gray-300 shadow-sm backdrop-blur-sm bg-white/70">
          <p class="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">ID Number</p>
          <p class="mt-1 font-mono font-bold text-gray-900">
            {{ employeeDetails.idNumber }}
          </p>
        </div>
     
      </div>
    </div>
  </div>
</div>
</div>


        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 justify-between mx-auto max-w-2xl">
        <Button type="button" @click="goToSelect"
          class="flex-1 px-6 py-3 font-medium text-gray-600 rounded-lg border border-gray-300 hover:bg-gray-50">
          Back to Selection
        </Button>
        <button type="button"
          class="flex flex-1 justify-center items-center px-6 py-3 font-medium text-white rounded-lg transition-all bg-primary hover:bg-teal-700"
          @click="finish">
          Confirm & Continue
          <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
