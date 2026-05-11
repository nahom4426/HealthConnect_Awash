<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import { ref } from "vue";
import Button from "@/components/Button.vue";

const dateRange = ref({
  start: new Date().toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
});

const reportType = ref('daily');
const isLoading = ref(false);

const generateReport = () => {
  isLoading.value = true;
  // TODO: Implement report generation logic
  console.log('Generating report with:', {
    dateRange: dateRange.value,
    reportType: reportType.value
  });
  
  // Simulate API call
  setTimeout(() => {
    isLoading.value = false;
    // TODO: Handle the generated report (download, show preview, etc.)
    alert('Report generated successfully!');
  }, 1500);
};
</script>

<template>
  <DefaultPage>
    <template #header>
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-semibold">Excel Daily Report</h1>
      </div>
    </template>

    <div class="bg-white rounded-lg shadow p-6">
      <div class="space-y-6">
        <!-- Report Type Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <div class="flex space-x-4">
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="reportType" 
                value="daily" 
                class="form-radio h-4 w-4 text-primary focus:ring-primary"
              >
              <span class="ml-2">Daily Report</span>
            </label>
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="reportType" 
                value="custom" 
                class="form-radio h-4 w-4 text-primary focus:ring-primary"
              >
              <span class="ml-2">Custom Range</span>
            </label>
          </div>
        </div>

        <!-- Date Range Picker -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700">Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              v-model="dateRange.start" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              :disabled="reportType === 'daily'"
            >
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              v-model="dateRange.end" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              :disabled="reportType === 'daily'"
            >
          </div>
        </div>

        <!-- Report Options -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Report Options</label>
          <div class="space-y-2">
            <div class="flex items-center">
              <input 
                id="includeDetails" 
                type="checkbox" 
                class="h-4 w-4 text-primary focus:ring-primary rounded border-gray-300"
                checked
              >
              <label for="includeDetails" class="ml-2 block text-sm text-gray-700">
                Include Detailed Transactions
              </label>
            </div>
            <div class="flex items-center">
              <input 
                id="includeSummary" 
                type="checkbox" 
                class="h-4 w-4 text-primary focus:ring-primary rounded border-gray-300"
                checked
              >
              <label for="includeSummary" class="ml-2 block text-sm text-gray-700">
                Include Summary Section
              </label>
            </div>
            <div class="flex items-center">
              <input 
                id="formatAsTable" 
                type="checkbox" 
                class="h-4 w-4 text-primary focus:ring-primary rounded border-gray-300"
                checked
              >
              <label for="formatAsTable" class="ml-2 block text-sm text-gray-700">
                Format as Excel Table
              </label>
            </div>
          </div>
        </div>

        <!-- Generate Button -->
        <div class="pt-4">
          <Button 
            :loading="isLoading"
            @click="generateReport"
            class="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <template #default>
              <span class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
                Generate Report
              </span>
            </template>
            <template #loading>
              <span class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            </template>
          </Button>
        </div>
      </div>
    </div>
  </DefaultPage>
</template>

<style scoped>
/* Add any custom styles here */
</style>
