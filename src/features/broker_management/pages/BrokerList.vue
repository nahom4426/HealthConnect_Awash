<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import Button from '@/components/Button.vue';
import BrokerStatusRow from '../components/BrokerStatusRow.vue';
import BrokerDataProvider from '../components/BrokerDataProvider.vue';
import { useBrokerStore } from '../stores/brokerStore';

const router = useRouter();
const toast = useToast();
const brokerStore = useBrokerStore();

const search = ref('');
const status = ref('ALL');
const refetch = ref(0);

const createNew = () => {
  router.push('/brokers/create');
};

const viewBroker = (row) => {
  router.push(`/brokers/${row.stakeholderUuid}`);
};

const toggleBrokerStatus = async (broker) => {
  // Prevent duplicate calls if store is already toggling
  if (brokerStore.isToggling) return;
  
  try {
    await brokerStore.toggleStatus(broker.stakeholderUuid, broker.status);
    const action = broker.status === 'ACTIVE' ? 'suspended' : 'activated';
    toast.success(`Broker successfully ${action}`);
  } catch (err) {
    // Error notification is handled locally but store manages revert
    toast.error(brokerStore.error || 'Failed to update broker status');
    throw err;
  }
};
</script>

<template>
  <div class="h-full">
    <BrokerDataProvider :search="search" :status="status" :refetch="refetch">
      <template #default="{ brokers, pending }">
        <DefaultPage
          v-model="search"
          placeholder="Search by name, email or license..."
        >
          <!-- Status Filter -->
          <template #filter>
            <select
              v-model="status"
              class="h-9 px-3 pr-8 text-sm font-medium text-gray-600 bg-white rounded-lg border border-gray-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
            </select>
          </template>

          <!-- Add Broker Button -->
          <template #add-action>
            <Button variant="primary" @click="createNew">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Broker
            </Button>
          </template>

          <!-- Table -->
          <template #default>
            <Table
              :pending="pending"  
              :headers="{
                head: ['№', 'Broker', 'License / Contact', 'Date Joined', 'Balance', 'Status', 'Actions'],
                row: ['firstName', 'licenseNumber', 'createdAt', 'currentBalance', 'status'],
              }"
              :rows="brokers"
              :hideIndex="true"
              :lastCol="true"
              :rowCom="BrokerStatusRow"
              :rowComProps="{
                onRowClick: viewBroker,
                onToggleStatus: toggleBrokerStatus,
              }"
              @row="viewBroker"
              @toggleStatus="toggleBrokerStatus"
            />
          </template>
        </DefaultPage>
      </template>
    </BrokerDataProvider>
  </div>
</template>
