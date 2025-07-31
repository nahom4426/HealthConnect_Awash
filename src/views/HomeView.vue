<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import ChartCard from "@/components/charts/ChartCard.vue";
import BarChart from "@/components/charts/BarChart.vue";
import LineChart from "@/components/charts/LineChart.vue";
import Table from "@/components/Table.vue";
import ProgressBar from "@/components/ProgressBar.vue";
import { useChartData } from "@/composables/useChartData";
import { ref, onMounted } from "vue";
import icons from "@/utils/icons";

const stats = ref([
  { title: "Total Quotations", value: 124, icon: icons.sales },
  { title: "Active Policies", value: 87, icon: icons.sales },
  { title: "Pending Claims", value: 32, icon: icons.sales },
  { title: "Total Providers", value: 56, icon: icons.sales },
]);
function getStatusColor(status: string | number) {
  const colors = {
    Submitted: "#FF8F0D",
    "In Process": "#FF8F0D",
    Verified: "#f59e0b",
    Approved: "#10b981",
    Completed: "#059669",
  };
  return "#6b7280";
}

const recentActivities = ref([
  {
    action: "New quotation created",
    institution: "ABC Hospital",
    time: "2 hours ago",
  },
  { action: "Claim approved", institution: "XYZ Clinic", time: "5 hours ago" },
  {
    action: "Policy renewed",
    institution: "City Medical Center",
    time: "1 day ago",
  },
  {
    action: "Provider added",
    institution: "Metro Healthcare",
    time: "2 days ago",
  },
]);

const activeProviders = ref([
  { name: "Metro Hospital", type: "Hospital", location: "Addis Ababa" },
  { name: "City Medical Center", type: "Clinic", location: "Bahir Dar" },
  { name: "Central Pharmacy", type: "Pharmacy", location: "Hawassa" },
  { name: "Regional Health Center", type: "Hospital", location: "Mekelle" },
  { name: "Family Clinic", type: "Clinic", location: "Dire Dawa" },
]);

const claimStatuses = ref([
  { status: "Submitted", count: 45, total: 7, percentage: 30 },
  { status: "In Process", count: 32, total: 7, percentage: 21 },
  { status: "Verified", count: 28, total: 7, percentage: 19 },
  { status: "Approved", count: 25, total: 7, percentage: 17 },
  { status: "Completed", count: 20, total: 7, percentage: 13 },
]);

const { policyVsClaimData, revenueChartData, fetchChartData } = useChartData();

const barChartOptions = {
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Count",
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      position: "top",
    },
  },
};

const lineChartOptions = {
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Amount",
      },
    },
  },
};

onMounted(() => {
  fetchChartData();
});
</script>

<template>
  <DefaultPage>
    <template #header>
      <h1 class="text-2xl font-bold"></h1>
    </template>

    <div class="p-4 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="(stat, index) in stats"
          :key="index"
          class="p-4 rounded-lg flex flex-col gap-4 bg-[#FFE5DC]"
        >
          <div class="flex items-center gap-4">
            <i v-html="stat.icon" />
            <p class="text-2xl font-bold">{{ stat.value }} Birr</p>
          </div>
          <div class="flex gap justify-between">
            <h3 class="text-gray-500 text-sm">{{ stat.title }}</h3>
            <div class="text-sm text-green-500">+8% from yesterday</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Policies vs Claims">
          <BarChart
            :chart-data="policyVsClaimData"
            :options="barChartOptions"
            :barThickness="20"
            :maxBarThickness="30"
            height="250px"
          />
        </ChartCard>

        <ChartCard title="Number of Policy Vs Claims">
          <LineChart
            :chart-data="revenueChartData"
            :options="lineChartOptions"
            height="250px"
            :fill="true"
          />
        </ChartCard>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white p-4 rounded-lg">
          <h2 class="text-xl font-semibold mb-4">Active Providers</h2>
          <Table
            :headers="{
              head: ['Provider Name', 'Type', 'Location'],
              row: ['name', 'type', 'location'],
            }"
            :rows="activeProviders"
            :showPagination="false"
          />
          <div class="mt-3 text-right">
            <RouterLink
              to="/providers/active"
              class="text-primary text-sm font-medium"
            >
              View All Providers →
            </RouterLink>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg">
          <h2 class="text-xl font-semibold mb-4">Claim Status</h2>
          <div class="space-y-2 flex flex-col gap-4">
            <div
              v-for="(item, index) in claimStatuses"
              :key="index"
              :class="[index < 4 ? 'border-b-2' : '']"
              class="pb-4"
            >
              <div class="flex justify-between items-center text-sm">
                <span class="font-medium w-24">{{ item.status }}</span>
                <div class="flex-1 mx-4">
                  <ProgressBar :percentage="item.percentage" height="0.3rem" />
                </div>
                <div
                  class="border border-orangebg p-1 rounded-lg text-xs font-bold"
                >
                  <span class="text-right w-24 text-orangebg">
                    {{ item.count }} / {{ item.total }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-3 text-right">
            <RouterLink
              to="/claim/process_claims"
              class="text-primary text-sm font-medium"
            >
              View All Claims →
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
        <div class="divide-y">
          <div
            v-for="(activity, index) in recentActivities"
            :key="index"
            class="py-3 flex justify-between"
          >
            <div>
              <p class="font-medium">{{ activity.action }}</p>
              <p class="text-sm text-gray-500">{{ activity.institution }}</p>
            </div>
            <span class="text-sm text-gray-400">{{ activity.time }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white p-4 rounded-lg shadow border border-gray-100">
        <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RouterLink
            to="/new_quotation"
            class="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center"
          >
            <p class="font-medium">New Quotation</p>
          </RouterLink>
          <RouterLink
            to="/underwriting/add_policy"
            class="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center"
          >
            <p class="font-medium">Add Policy</p>
          </RouterLink>
          <RouterLink
            to="/claim/cash_claim"
            class="p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center"
          >
            <p class="font-medium">Process Claim</p>
          </RouterLink>
          <RouterLink
            to="/providers/add"
            class="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center"
          >
            <p class="font-medium">Add Provider</p>
          </RouterLink>
        </div>
      </div>
    </div>
  </DefaultPage>
</template>
