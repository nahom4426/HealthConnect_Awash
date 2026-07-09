<script setup>
import { ref, computed, watch } from 'vue';
import { useRulesStore } from '../stores/rulesStore';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import Button from '@/components/Button.vue';
import CommissionRulesDataProvider from '../components/CommissionRulesDataProvider.vue';
import CommissionRuleRow from '../components/CommissionRuleRow.vue';
import { openModal } from '@customizer/modal-x';
import { useToast } from 'vue-toastification';

const toast = useToast();
const rulesStore = useRulesStore();

// Refs for the data provider
const dataProvider = ref();

// Filter states
const search = ref('');
const statusFilter = ref('ALL');
const stakeholderTypeFilter = ref('');
const policyTypeFilter = ref('');

// Track if table should show loading
const tableLoading = ref(false);
const errorMessage = ref('');

// Track which rule is being toggled
const togglingRuleId = ref(null);

// Computed
const isLoading = computed(() => {
  return tableLoading.value;
});

// Watch for store loading state changes
watch(() => rulesStore.loading, (newVal) => {
  if (!newVal) {
    setTimeout(() => {
      tableLoading.value = false;
    }, 100);
  }
});

// Watch for store errors
watch(() => rulesStore.error, (newVal) => {
  if (newVal) {
    errorMessage.value = newVal;
    toast.error(newVal);
  }
});

// Modal functions
function openCreateModal() {
  errorMessage.value = '';
  // Pass empty data for create mode
  openModal('CreateCommissionRule', { 
    data: {} 
  });
}

function openEditModal(rule) {
  errorMessage.value = '';
  // Pass the rule data for edit mode
  openModal('CreateCommissionRule', { 
    rule: rule 
  });
}

async function toggleRuleStatus(rule) {
  // Prevent multiple calls
  if (rulesStore.isToggling || togglingRuleId.value) return;
  
  // Set the rule being toggled
  togglingRuleId.value = rule.ruleUuid;
  errorMessage.value = '';
  
  try {
    await rulesStore.toggleStatus(rule.ruleUuid, rule.status);
    
    // Show custom success message
    const action = rule.status === 'ACTIVE' ? 'deactivated' : 'activated';
    toast.success(`Rule "${rule.ruleName}" ${action} successfully`);
  } catch (err) {
    const errorData = err?.response?.data;
    let message = 'Failed to toggle rule status';
    
    if (rulesStore.error) {
      message = rulesStore.error;
    } else if (errorData?.detail) {
      if (errorData.detail.includes('Overlapping commission rule')) {
        message = 'Cannot activate rule: Overlapping commission rule already exists for this period.';
      } else if (errorData.detail.includes('Unable to find instance for payer')) {
        message = 'Service temporarily unavailable. Please try again later.';
      } else {
        message = errorData.detail;
      }
    } else if (errorData?.message) {
      message = errorData.message;
    } else if (err?.message) {
      message = err.message;
    }
    
    errorMessage.value = message;
    toast.error(message);
  } finally {
    // Clear the toggling state
    setTimeout(() => {
      togglingRuleId.value = null;
    }, 300);
  }
}

// Handle search from DefaultPage
function handleSearch(searchTerm) {
  search.value = searchTerm;
}
</script>

<template>
  <div class="h-full">
    <CommissionRulesDataProvider
      ref="dataProvider"
      :search="search"
      :status="statusFilter"
      :stakeholderType="stakeholderTypeFilter"
      :policyType="policyTypeFilter"
      :auto="true"
    >
      <template #default="{ 
        rules, 
        pending, 
        error, 
        currentPage, 
        itemsPerPage, 
        totalPages, 
        totalItems,
        refresh 
      }">
        <DefaultPage 
          :hideSearch="false"
          :modelValue="search"
          :pending="pending || isLoading"
          title="Commission Rules"
          subtitle="Configure commission percentages for different policy types"
          :modern="true"
          @update:modelValue="handleSearch"
          @search="handleSearch"
        >
          <!-- Add Action -->
          <template #add-action>
            <Button 
              variant="primary" 
              @click="openCreateModal"
              class="shadow-sm hover:shadow-md transition-shadow"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 mr-1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Rule
            </Button>
          </template>

          <!-- Filters -->
          <template #filter>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="statusFilter"
                class="h-9 px-3 pr-8 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all hover:border-gray-300"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
              <select
                v-model="stakeholderTypeFilter"
                class="h-9 px-3 pr-8 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all hover:border-gray-300"
              >
                <option value="">All Types</option>
                <option value="BROKER">Broker</option>
                <option value="AGENT">Agent</option>
              </select>
              <select
                v-model="policyTypeFilter"
                class="h-9 px-3 pr-8 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all hover:border-gray-300"
              >
                <option value="">All Policies</option>
                <option value="GENERAL">General</option>
                <option value="MOTOR">Motor</option>
                <option value="HEALTH">Health</option>
                <option value="LIFE">Life</option>
              </select>
              
              <button
                @click="refresh"
                class="h-9 px-3 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
                title="Refresh"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </template>

          <!-- Main Content -->
          <template #default>
            <div v-if="error" class="px-4 py-3 mb-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 flex-shrink-0 mt-0.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ error }}</span>
            </div>
            
            <Table
              :pending="pending || isLoading"
              :headers="{
                head: ['№', 'Rule Name', 'Stakeholder Type', 'Policy Type', 'Commission %', 'Status', 'Effective Period', 'Actions'],
                row: ['name', 'stakeholderType', 'policyType', 'commissionPercentage', 'status', 'effectivePeriod'],
              }"
              :rows="rules"
              :hideIndex="true"
              :lastCol="true"
              placeholder="No commission rules configured yet."
              :rowCom="CommissionRuleRow"
              :rowComProps="{
                onEditClick: openEditModal,
                onToggleStatus: toggleRuleStatus,
                currentPage: currentPage,
                perPage: itemsPerPage,
              }"
              @edit="openEditModal"
              @toggleStatus="toggleRuleStatus"
            />
          </template>
        </DefaultPage>
      </template>
    </CommissionRulesDataProvider>
  </div>
</template>