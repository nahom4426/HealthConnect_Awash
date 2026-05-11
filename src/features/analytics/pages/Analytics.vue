<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import ChartCard from '@/components/charts/ChartCard.vue';
import BarChart from '@/components/charts/BarChart.vue';
import LineChart from '@/components/charts/LineChart.vue';
import DoughnutChart from '@/components/charts/DoughnutChart.vue';
import KPICard from '../components/KPICard.vue';
import AnalyticsTable from '../components/AnalyticsTable.vue';

// KPI Data
const kpis = ref([
  { title: 'Total Paid Claims', value: 'ETB 2,450,000', change: '+12.5%', trend: 'up', icon: '📊' },
  { title: 'Total Claims Submitted', value: '1,245', change: '+8.3%', trend: 'up', icon: '📝' },
  { title: 'Claims Approved Rate', value: '87.5%', change: '+5.2%', trend: 'up', icon: '✅' },
  { title: 'Avg Loss Ratio', value: '45.2%', change: '-2.1%', trend: 'down', icon: '📉' },
]);

// Periodic Total Paid Claims Data (Bar Chart)
const periodicPaidClaimsData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Paid Claims',
      data: [30, 40, 45, 50, 48, 60, 70, 81, 80, 75, 65, 55],
      backgroundColor: '#93C5FD',
      borderRadius: 6,
    }
  ]
});

// Total Loss Ratio by Policyholder and Cover Types (Grouped Bar Chart)
const lossRatioData = ref({
  labels: ['CBE', 'Medco', 'Dashin Bank'],
  datasets: [
    {
      label: 'Total Loss',
      data: [110, 55, 75],
      backgroundColor: '#FECACA',
      borderRadius: 6,
    },
    {
      label: 'Total Gain',
      data: [15, 80, 95],
      backgroundColor: '#A7F3D0',
      borderRadius: 6,
    }
  ]
});

// Paid Claims by Providers and Service Types (Stacked Bar Chart)
const paidClaimsByProvidersData = ref({
  labels: ['Addis Harar', 'TekleMariam', 'Hayal Hospital', 'Amen Hospital', 'Beta zolla'],
  datasets: [
    {
      label: 'Laboratory',
      data: [44, 55, 41, 87, 22],
      backgroundColor: '#FECACA',
    },
    {
      label: 'Pharmacy',
      data: [13, 23, 20, 13, 43],
      backgroundColor: '#FED7AA',
    },
    {
      label: 'Surgical service',
      data: [21, 7, 25, 8, 22],
      backgroundColor: '#BEF264',
    },
    {
      label: 'Radiotherapy',
      data: [11, 27, 15, 13, 18],
      backgroundColor: '#A5F3FC',
    },
    {
      label: 'Dental',
      data: [11, 27, 15, 13, 18],
      backgroundColor: '#D8B4FE',
    }
  ]
});

// Total Claims Created by Insurer/Provider/Claimants (Pie Chart)
const claimsCreatedData = ref({
  labels: ['Insurer 1', 'Insurer 2', 'Insurer 3', 'Insurer 4', 'Insurer 5'],
  datasets: [
    {
      data: [24.0, 24.7, 7.3, 21.1, 12.4],
      backgroundColor: ['#93C5FD', '#FECACA', '#FED7AA', '#A7F3D0', '#D8B4FE'],
      borderColor: '#fff',
      borderWidth: 2,
    }
  ]
});

// Total Number of Claims Submitted, Paid, and Rejected (Grouped Bar Chart)
const claimsStatusData = ref({
  labels: ['CBE', 'Medco', 'Dashin Bank', 'Sheraton', 'Sellawy'],
  datasets: [
    {
      label: 'Submitted',
      data: [45, 55, 40, 10, 20],
      backgroundColor: '#93C5FD',
      borderRadius: 6,
    },
    {
      label: 'Paid',
      data: [12, 22, 18, 8, 15],
      backgroundColor: '#A7F3D0',
      borderRadius: 6,
    },
    {
      label: 'Rejected',
      data: [8, 15, 12, 5, 18],
      backgroundColor: '#FECACA',
      borderRadius: 6,
    }
  ]
});

// Top 5 Institutions (Area Chart)
const topInstitutionsData = ref({
  labels: ['00:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00'],
  datasets: [
    {
      label: 'Medco',
      data: [30, 50, 40, 60, 70, 80, 90],
      borderColor: '#93C5FD',
      backgroundColor: 'rgba(147, 197, 253, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'CBE',
      data: [20, 30, 35, 45, 55, 65, 75],
      borderColor: '#FED7AA',
      backgroundColor: 'rgba(254, 215, 170, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Dashin Bank',
      data: [40, 45, 50, 55, 60, 70, 85],
      borderColor: '#A7F3D0',
      backgroundColor: 'rgba(167, 243, 208, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Sheraton',
      data: [25, 35, 40, 50, 60, 75, 95],
      borderColor: '#D8B4FE',
      backgroundColor: 'rgba(216, 180, 254, 0.2)',
      fill: true,
      tension: 0.4,
    }
  ]
});

// Total Premium Collected (Doughnut Chart)
const premiumCollectedData = ref({
  labels: ['series-1', 'series-2', 'series-3', 'series-4', 'series-5'],
  datasets: [
    {
      data: [25.6, 32.0, 23.8, 9.9, 8.7],
      backgroundColor: ['#93C5FD', '#A7F3D0', '#FED7AA', '#FECACA', '#D8B4FE'],
      borderColor: '#fff',
      borderWidth: 3,
    }
  ]
});

// Top Institutions Table Data
const topInstitutionsTableData = ref([
  { rank: 1, institution: 'Medco', insuredPersons: 1250, percentage: 28.5 },
  { rank: 2, institution: 'CBE', insuredPersons: 980, percentage: 22.3 },
  { rank: 3, institution: 'Dashin Bank', insuredPersons: 875, percentage: 19.9 },
  { rank: 4, institution: 'Sheraton', insuredPersons: 650, percentage: 14.8 },
  { rank: 5, institution: 'Addis Harar', insuredPersons: 520, percentage: 11.8 },
]);

onMounted(() => {
  // Data can be fetched from API here
  console.log('Analytics page loaded');
});
</script>

<template>
  <DefaultPage :hideSearch="true" title="Analytics Dashboard" subtitle="Comprehensive claims and policy analytics">
    <div class="px-6 py-8 -mx-6 -my-6 space-y-8 bg-gradient-to-br via-blue-50 to-indigo-50 rounded-2xl from-slate-50">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          v-for="(kpi, idx) in kpis" 
          :key="idx"
          :title="kpi.title"
          :value="kpi.value"
          :change="kpi.change"
          :trend="kpi.trend"
          :icon="kpi.icon"
        />
      </div>

      <!-- Row 1: Periodic Paid Claims & Loss Ratio -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Periodic Total Paid Claims" subtitle="Monthly paid claims trend">
          <BarChart :chart-data="periodicPaidClaimsData" height="300px" />
        </ChartCard>

        <ChartCard title="Total Loss Ratio by Policyholder and Cover Types" subtitle="Loss vs Gain analysis">
          <BarChart :chart-data="lossRatioData" height="300px" />
        </ChartCard>
      </div>

      <!-- Row 2: Paid Claims by Providers & Claims Created -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Paid Claims by Providers and Service Types" subtitle="Breakdown by provider and service">
          <BarChart :chart-data="paidClaimsByProvidersData" height="300px" />
        </ChartCard>

        <ChartCard title="Total Claims Created by Insurer/Provider/Claimants" subtitle="Distribution of claim origins">
          <DoughnutChart :data="claimsCreatedData" height="300px" />
        </ChartCard>
      </div>

      <!-- Row 3: Claims Status & Top Institutions -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Total Number of Claims Submitted, Paid, and Rejected by Policyholder" subtitle="Claims status breakdown">
          <BarChart :chart-data="claimsStatusData" height="300px" />
        </ChartCard>

        <ChartCard title="Top 5 Institutions with the highest number of insured persons" subtitle="Insured persons trend">
          <LineChart :chartData="topInstitutionsData" height="300px" />
        </ChartCard>
      </div>

      <!-- Row 4: Premium Collected & Table -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Total Premium Collected by Policyholders" subtitle="Premium distribution">
          <DoughnutChart :data="premiumCollectedData" height="300px" />
        </ChartCard>

        <ChartCard title="Top 5 Institutions" subtitle="Insured persons count">
          <AnalyticsTable :data="topInstitutionsTableData" />
        </ChartCard>
      </div>
    </div>
  </DefaultPage>
</template>

<style scoped>
</style>
