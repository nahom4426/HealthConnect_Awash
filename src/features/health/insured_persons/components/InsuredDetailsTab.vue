<template>
  <div class="space-y-6">
    <!-- Header with Photo and Basic Info -->
    <div class="grid gap-6 md:grid-cols-3">
      <!-- Profile Card -->
      <div class="md:col-span-1">
        <div class="overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100">
          <div class="p-6 text-center">
            <div class="flex justify-center mb-4">
              <div class="relative">
                <img
                  :src="
                    getProfileUrl(insuredData.profile) ||
                    getProfileUrl(insuredData.profilePictureBase64) ||
                    getProfileUrl(insuredData.photoUrl) ||
                    imageSrc
                  "
                  alt="Profile"
                  class="object-cover w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg"
                  @error="(e) => (e.target.src = imageSrc)"
                />
              </div>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ insuredData.firstName }} {{ insuredData.fatherName }}
            </h2>
            <p class="mt-1 text-sm text-gray-600">{{ insuredData.position || 'N/A' }}</p>
            <div class="mt-4 pt-4 border-t border-gray-200">
              <span :class="`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                insuredData.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`">
                {{ insuredData.status || 'N/A' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="md:col-span-2 space-y-4">
        <!-- Contact Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Information
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">Email</span>
              <span class="text-sm text-gray-900 font-semibold">{{ insuredData.email || 'N/A' }}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">Phone</span>
              <span class="text-sm text-gray-900 font-semibold">{{ insuredData.phone || 'N/A' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Employee ID</span>
              <span class="text-sm text-gray-900 font-semibold">{{ insuredData.idNumber || insuredData.employeeId || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Personal Information
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">Gender</span>
              <span class="text-sm text-gray-900 font-semibold">{{ insuredData.gender || 'N/A' }}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">Date of Birth</span>
              <span class="text-sm text-gray-900 font-semibold">{{ formatDate(insuredData.birthDate) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-600">Father's Name</span>
              <span class="text-sm text-gray-900 font-semibold">{{ insuredData.fatherName || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Address Information -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Address Information
      </h3>
      <div class="grid gap-4 md:grid-cols-3">
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <p class="text-xs font-medium text-gray-600 mb-1">Address</p>
          <p class="text-sm font-semibold text-gray-900">{{ insuredData.address || 'N/A' }}</p>
        </div>
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <p class="text-xs font-medium text-gray-600 mb-1">State/Province</p>
          <p class="text-sm font-semibold text-gray-900">{{ insuredData.state || 'N/A' }}</p>
        </div>
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
          <p class="text-xs font-medium text-gray-600 mb-1">Country</p>
          <p class="text-sm font-semibold text-gray-900">{{ insuredData.country || 'N/A' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import imageSrc from '@/assets/img/profile.png';

defineProps({
  insuredData: {
    type: Object,
    required: true
  }
});

function getProfileUrl(profileData) {
  if (!profileData) return null;
  
  // Check if it's a base64 string (starts with typical base64 chars, not http)
  if (profileData.startsWith('iVBORw0KGgo') || profileData.startsWith('/9j/') || !profileData.startsWith('http')) {
    // It's base64, add data URI prefix
    return `data:image/png;base64,${profileData}`;
  }
  
  // It's already a URL
  return profileData;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>

<style scoped>
/* Smooth transitions */
.transition-all {
  transition: all 0.3s ease;
}
</style>
