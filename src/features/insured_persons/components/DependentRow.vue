<template>
  <div class="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <!-- Main content with photo on left -->
    <div class="flex gap-4">
      <!-- Profile Photo -->
      <div class="flex-shrink-0">
        <div class="relative">
          <div class="overflow-hidden w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-4 border-white shadow-lg">
            <img 
              v-if="dependent.profile || dependent.photoBase64" 
              :src="getProfileUrl(dependent.profile || dependent.photoBase64)" 
              alt="Profile" 
              class="object-cover w-full h-full"
              @error="handleImageError"
            />
            <div v-else class="flex justify-center items-center w-full h-full text-2xl">
              {{ getInitials(dependent.firstName) }}
            </div>
          </div>
          <!-- Relationship indicator on photo -->
          <span :class="`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-lg text-xs font-bold text-white ${getRelationshipBgColor(dependent.relationship)}`">
            {{ getShortRelationship(dependent.relationship) }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1">
        <!-- Header with name and status -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <div class="flex gap-2 items-center mb-1">
              <span class="text-xl">{{ getGenderIcon(dependent.gender) }}</span>
              <h3 class="text-xl font-bold text-gray-900">
                {{ dependent.firstName }} {{ dependent.fatherName }} {{ dependent.grandFatherName }}
              </h3>
            </div>
            <!-- Changed from title to idNumber -->
            <p class="text-sm text-gray-500">
              {{ dependent.idNumber || 'No ID Number' }}
            </p>
          </div>
          
          <span :class="`px-3 py-1.5 rounded-full text-xs font-semibold ${
            dependent.status === 'ACTIVE' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`">
            {{ dependent.status }}
          </span>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Birth Date -->
          <div class="space-y-1">
            <div class="flex gap-2 items-center text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="text-xs font-medium">Birth Date</span>
            </div>
            <span class="block font-semibold text-gray-900">
              {{ dependent.birthDate ? formatDate(dependent.birthDate) : 'N/A' }}
            </span>
          </div>

          <!-- Gender -->
          <div class="space-y-1">
            <div class="flex gap-2 items-center text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="text-xs font-medium">Gender</span>
            </div>
            <span class="block font-semibold text-gray-900">{{ dependent.gender || 'N/A' }}</span>
          </div>

          <!-- Phone -->
          <div v-if="dependent.phone" class="space-y-1">
            <div class="flex gap-2 items-center text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span class="text-xs font-medium">Phone</span>
            </div>
            <a :href="`tel:${dependent.phone}`" class="block font-semibold text-blue-600 transition-colors hover:text-blue-800">
              {{ dependent.phone }}
            </a>
          </div>

          <!-- Relationship (Full) -->
          <div class="space-y-1">
            <div class="flex gap-2 items-center text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-2.25 2.25-1.5-1.5" />
              </svg>
              <span class="text-xs font-medium">Relationship</span>
            </div>
            <span :class="`block font-semibold ${getRelationshipTextColor(dependent.relationship)}`">
              {{ dependent.relationship }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';  
import icons from "@/utils/icons";

const props = defineProps({
  dependent: {
    type: Object,
    required: true
  },
  insuredUuid: {
    type: String,
    required: true
  }
});

function getBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
}

function handleImageError(event) {
  event.target.style.display = 'none';
  const parent = event.target.parentElement;
  if (parent) {
    parent.innerHTML = `
      <div class="flex justify-center items-center w-full h-full text-2xl">
        ${getInitials(props.dependent.firstName)}
      </div>
    `;
  }
}

function getRelationshipColor(relationship) {
  const colors = {
    'Spouse': 'bg-pink-100 text-pink-800',
    'Child': 'bg-blue-100 text-blue-800',
    'Parent': 'bg-purple-100 text-purple-800',
    'Sibling': 'bg-orange-100 text-orange-800',
    'Other': 'bg-gray-100 text-gray-800'
  };
  return colors[relationship] || colors['Other'];
}

function getRelationshipBgColor(relationship) {
  const colors = {
    'Spouse': 'bg-pink-500',
    'Child': 'bg-blue-500',
    'Parent': 'bg-purple-500',
    'Sibling': 'bg-orange-500',
    'Other': 'bg-gray-500'
  };
  return colors[relationship] || colors['Other'];
}

function getRelationshipTextColor(relationship) {
  const colors = {
    'Spouse': 'text-pink-600',
    'Child': 'text-blue-600',
    'Parent': 'text-purple-600',
    'Sibling': 'text-orange-600',
    'Other': 'text-gray-600'
  };
  return colors[relationship] || colors['Other'];
}

function getGenderIcon(gender) {
  return gender?.toLowerCase() === 'female' ? '👩' : '👨';
}

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
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getShortRelationship(relationship) {
  const shortForms = {
    'Spouse': 'SP',
    'Child': 'CH',
    'Parent': 'PR',
    'Sibling': 'SB',
    'Other': 'OT'
  };
  return shortForms[relationship] || relationship?.charAt(0) || '??';
}

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}
</script>

<style scoped>
/* Smooth transitions */
.transition-shadow {
  transition: box-shadow 0.2s ease;
}
</style>