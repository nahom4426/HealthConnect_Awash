<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Daily Reports</h1>
      <p class="text-gray-600">Manage and track daily reports and tasks</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Summary Cards -->
      <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-xl shadow-sm">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Reports</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalReports }}</p>
            </div>
          </div>
          <div class="text-blue-100">
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-xl shadow-sm">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p class="text-2xl font-bold text-gray-900">{{ completedTasks }}</p>
            </div>
          </div>
          <div class="text-green-100">
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="p-3 bg-yellow-100 rounded-xl shadow-sm">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p class="text-2xl font-bold text-gray-900">{{ pendingTasks }}</p>
            </div>
          </div>
          <div class="text-yellow-100">
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Daily Reports List -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-xl">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Recent Daily Reports</h2>
            <button class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>New Report</span>
            </button>
          </div>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div v-for="report in recentReports" :key="report.id" class="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200 bg-white">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>{{ report.title }}</span>
                </h3>
                <span class="text-xs text-gray-500 flex items-center space-x-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>{{ formatDate(report.date) }}</span>
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ report.summary }}</p>
              <div class="flex justify-between items-center">
                <span class="text-xs px-3 py-1 rounded-full font-medium" :class="getStatusClass(report.status)">
                  {{ report.status }}
                </span>
                <button @click="viewReport(report)" class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 transition-colors duration-200">
                  <span>View Details</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Task Tracking Form -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-t-xl">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Task Tracking</h2>
            <div class="flex items-center space-x-2">
              <span class="text-xs text-gray-500">Quick add task</span>
              <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <div class="p-6 bg-gradient-to-br from-gray-50 to-white">
          <TaskTrackingForm @task-submitted="handleTaskSubmitted" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TaskTrackingForm from '@/components/TaskTrackingForm.vue';

const totalReports = ref(0);
const completedTasks = ref(0);
const pendingTasks = ref(0);
const recentReports = ref([]);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getStatusClass = (status) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const viewReport = (report) => {
  console.log('Viewing report:', report);
  // Implement view report logic
};

const handleTaskSubmitted = (task) => {
  console.log('New task submitted:', task);
  // Refresh data or update UI
  loadDashboardData();
};

const loadDashboardData = async () => {
  try {
    // Mock data for demonstration
    totalReports.value = 24;
    completedTasks.value = 18;
    pendingTasks.value = 6;
    
    recentReports.value = [
      {
        id: 1,
        title: 'Daily Report - Marketing Team',
        summary: 'Completed campaign analysis and lead generation activities',
        date: '2024-01-15',
        status: 'completed'
      },
      {
        id: 2,
        title: 'Daily Report - Development Team',
        summary: 'Bug fixes and feature implementation progress',
        date: '2024-01-15',
        status: 'in progress'
      },
      {
        id: 3,
        title: 'Daily Report - Sales Team',
        summary: 'Client meetings and follow-ups conducted',
        date: '2024-01-14',
        status: 'completed'
      },
      {
        id: 4,
        title: 'Daily Report - Support Team',
        summary: 'Customer tickets resolved and system maintenance',
        date: '2024-01-14',
        status: 'pending'
      }
    ];
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>
