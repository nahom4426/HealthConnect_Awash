<script setup>
import { ref, onMounted, computed } from 'vue';
import { useBrokerStore } from '../stores/brokerStore';
import { useCommissionStore } from '../stores/commissionStore';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import StatusBadge from '../components/StatusBadge.vue';
import { formatCurrency, formatDate } from '../api/utils';

const brokerStore = useBrokerStore();
const commissionStore = useCommissionStore();

const loading = ref(true);

onMounted(async () => {
  try {
    await brokerStore.fetchAllBrokers();
  } catch (err) {
    console.error('Failed to load report data', err);
  } finally {
    loading.value = false;
  }
});

// Stats
const totalBrokers = computed(() => brokerStore.brokers.length);
const activeBrokers = computed(() => brokerStore.brokers.filter(b => b.status === 'ACTIVE').length);
const inactiveBrokers = computed(() => brokerStore.brokers.filter(b => b.status === 'INACTIVE').length);
const pendingBrokers = computed(() => brokerStore.brokers.filter(b => b.status === 'PENDING').length);

const totalBalance = computed(() => brokerStore.brokers.reduce((sum, b) => sum + (b.currentBalance || 0), 0));

// Top brokers by balance
const topBrokers = computed(() => {
  return [...brokerStore.brokers]
    .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
    .slice(0, 10);
});

// Status distribution for visual chart
const statusDistribution = computed(() => {
  const total = totalBrokers.value || 1;
  return {
    active: ((activeBrokers.value / total) * 100).toFixed(1),
    inactive: ((inactiveBrokers.value / total) * 100).toFixed(1),
    pending: ((pendingBrokers.value / total) * 100).toFixed(1),
  };
});
</script>

<template>
  <DefaultPage :hideSearch="true">

    <!-- Header -->
    <template #first>
      <div class="flex items-center gap-2">
        <div class="p-2 rounded-lg bg-violet-50 text-violet-600">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-gray-700">Broker Reports</p>
          <p class="text-xs text-gray-400">Analytics and performance overview</p>
        </div>
      </div>
    </template>

    <!-- Content -->
    <template #default>
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm text-gray-400">Loading report data...</span>
        </div>
      </div>

      <div v-else class="flex flex-col gap-5">

        <!-- Summary Stats Row -->
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Brokers</span>
              <div class="p-1.5 rounded-lg bg-blue-50">
                <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-gray-900">{{ totalBrokers }}</div>
          </div>

          <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active</span>
              <div class="p-1.5 rounded-lg bg-green-50">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-emerald-600">{{ activeBrokers }}</div>
          </div>

          <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inactive</span>
              <div class="p-1.5 rounded-lg bg-red-50">
                <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-red-600">{{ inactiveBrokers }}</div>
          </div>

          <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Balance</span>
              <div class="p-1.5 rounded-lg bg-indigo-50">
                <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="text-3xl font-bold text-indigo-600">{{ formatCurrency(totalBalance) }}</div>
          </div>
        </div>

        <!-- Status Distribution Bar -->
        <div class="bg-white rounded-xl shadow-xs border border-gray-100 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Status Distribution</h3>
          <div class="flex h-4 rounded-full overflow-hidden bg-gray-100">
            <div
              class="bg-emerald-500 transition-all duration-500"
              :style="{ width: statusDistribution.active + '%' }"
              :title="`Active: ${statusDistribution.active}%`"
            ></div>
            <div
              class="bg-amber-400 transition-all duration-500"
              :style="{ width: statusDistribution.pending + '%' }"
              :title="`Pending: ${statusDistribution.pending}%`"
            ></div>
            <div
              class="bg-red-400 transition-all duration-500"
              :style="{ width: statusDistribution.inactive + '%' }"
              :title="`Inactive: ${statusDistribution.inactive}%`"
            ></div>
          </div>
          <div class="flex gap-6 mt-3">
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Active ({{ statusDistribution.active }}%)
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Pending ({{ statusDistribution.pending }}%)
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-500">
              <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              Inactive ({{ statusDistribution.inactive }}%)
            </div>
          </div>
        </div>

        <!-- Top Brokers by Balance -->
        <div class="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Top Brokers by Commission Balance</h3>
            <span class="text-xs text-gray-400">Top 10</span>
          </div>
          <Table
            :pending="false"
            :headers="{
              head: ['Rank', 'Broker', 'License', 'Status', 'Balance'],
              row: ['rank', 'firstName', 'licenseNumber', 'status', 'currentBalance'],
            }"
            :rows="topBrokers"
            :hideIndex="true"
            placeholder="No brokers found."
          >
            <template #rank="{ row }">
              <div class="flex items-center justify-center">
                <span
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  :class="
                    topBrokers.indexOf(row) === 0 ? 'bg-yellow-100 text-yellow-700' :
                    topBrokers.indexOf(row) === 1 ? 'bg-gray-100 text-gray-600' :
                    topBrokers.indexOf(row) === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  "
                >
                  {{ topBrokers.indexOf(row) + 1 }}
                </span>
              </div>
            </template>
            <template #firstName="{ row }">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {{ row.firstName?.[0] }}{{ row.lastName?.[0] }}
                </div>
                <div>
                  <div class="font-medium text-gray-900 text-sm">{{ row.firstName }} {{ row.lastName }}</div>
                  <div class="text-xs text-gray-400">{{ row.email }}</div>
                </div>
              </div>
            </template>
            <template #licenseNumber="{ row }">
              <span class="text-sm text-gray-700">{{ row.licenseNumber || '—' }}</span>
            </template>
            <template #status="{ row }">
              <StatusBadge :status="row.status" />
            </template>
            <template #currentBalance="{ row }">
              <span class="text-sm font-bold text-gray-900">{{ formatCurrency(row.currentBalance) }}</span>
            </template>
          </Table>
        </div>

        <!-- Recently Joined Brokers -->
        <div class="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700">Recently Joined Brokers</h3>
          </div>
          <div class="divide-y divide-gray-50">
            <div
              v-for="broker in brokerStore.brokers.slice(0, 5)"
              :key="broker.stakeholderUuid"
              class="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {{ broker.firstName?.[0] }}{{ broker.lastName?.[0] }}
                </div>
                <div>
                  <div class="font-medium text-gray-900 text-sm">{{ broker.firstName }} {{ broker.lastName }}</div>
                  <div class="text-xs text-gray-400">Joined {{ formatDate(broker.createdAt) }}</div>
                </div>
              </div>
              <StatusBadge :status="broker.status" />
            </div>
          </div>
        </div>

      </div>
    </template>
  </DefaultPage>
</template>
