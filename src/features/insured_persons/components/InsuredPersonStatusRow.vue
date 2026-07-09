<template>
  <template v-for="(row, idx) in rowData" :key="getRowKey(row, idx)">
    <!-- Main Row with Dynamic Status Classes -->
    <tr 
      @click.self="props.onRowClick(row)" 
      :class="getRowStatusClass(row)"
    >  
      <!-- Row Number with Status Indicator -->
      <td class="p-4">
        <div class="flex gap-3 items-center">
          <!-- Status Badge Dot with Pulse for Inactive/Suspended -->
          <div class="flex relative justify-center items-center">
            <span 
              v-if="isInactive(row) || isSuspended(row)"
              class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping"
              :class="getStatusPingClass(row)"
            ></span>
            <span 
              class="inline-flex relative w-2.5 h-2.5 rounded-full"
              :class="getStatusDotClass(row)"
            ></span>
          </div>
          
          <!-- Row Number -->
          <span 
            class="font-medium transition-colors duration-200"
            :class="getTextStatusClass(row)"
          >
            {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
          </span>
        </div>
      </td>  

      <!-- Dynamic Columns -->
      <td class="p-3 py-4" v-for="key in rowKeys" :key="key">  
        <div v-if="key === 'status'" class="truncate">  
          <span 
            class="inline-flex gap-1.5 items-center px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm"
            :class="getStatusBadgeClass(row)"
          >
            <!-- Small status indicator inside badge -->
            <span class="w-1.5 h-1.5 rounded-full" :class="getStatusInnerDotClass(row)"></span>
            {{ row?.status }}
          </span>
        </div>
        
        <div v-else-if="key === 'fullName'" 
             class="flex gap-3 items-center"
             :class="getTextStatusClass(row)"
        >
          <!-- Profile Image with fallbacks -->
          <img 
            v-if="row?.profile" 
            :src="row.profile" 
            alt="Profile" 
            class="object-cover w-10 h-10 rounded-full border-2 transition-all duration-200"
            :class="getImageBorderClass(row)"
            @error="handleImageError"
          />
          <img 
            v-else-if="row?.photoBase64" 
            :src="row.photoBase64" 
            alt="Profile" 
            class="object-cover w-10 h-10 rounded-full border-2 transition-all duration-200"
            :class="getImageBorderClass(row)"
            @error="handleImageError"
          />
          <img 
            v-else-if="row?.photoUrl" 
            :src="row.photoUrl" 
            alt="Profile" 
            class="object-cover w-10 h-10 rounded-full border-2 transition-all duration-200"
            :class="getImageBorderClass(row)"
            @error="handleImageError"
          />
          <img 
            v-else-if="row?.photoPath" 
            :src="`${getBaseUrl()}/insured/photo/${row.photoPath}`" 
            alt="Profile" 
            class="object-cover w-10 h-10 rounded-full border-2 transition-all duration-200"
            :class="getImageBorderClass(row)"
            @error="handleImageError"
          />
          <img 
            v-else
            :src="genderFallbackUrl(row?.gender)"
            alt="Profile"
            class="object-cover w-10 h-10 rounded-full border-2 transition-all duration-200"
            :class="getImageBorderClass(row)"
            @error="(e) => (e.target.src = '/src/assets/img/profile.png')"
          />
          
          <div class="leading-tight truncate">
            <div class="font-semibold" :class="getTextStatusClass(row)">
              {{ row?.firstName || '' }} {{ row?.fatherName || '' }} {{ row?.grandFatherName || row?.grandfatherName || '' }}
            </div>
            <div class="text-xs" :class="getMutedTextStatusClass(row)" v-if="row?.idNumber">
              <span class="text-sm">{{ getGenderIcon(row.gender) }}</span>
              <span v-if="row.idNumber" class="mx-1">•</span>
              <span v-if="row.idNumber">ID: {{ row.idNumber }}</span>
            </div>
          </div>
        </div>

        <!-- Dependents Column -->
        <div v-else-if="key === 'dependents'" class="text-start">
          <button
            v-if="row?.dependantResponses && row.dependantResponses.length > 0"
            @click.stop="toggleRowExpansion(getRowId(row))"
            class="inline-flex gap-1.5 items-center px-3 py-1.5 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200"
            :class="getDependantsButtonClass(row, expandedRows.has(getRowId(row)))"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            {{ row.dependantResponses.length }}
          </button>
          <span v-else 
                class="inline-flex gap-1.5 items-center px-3 py-1.5 text-sm font-semibold rounded-lg"
                :class="getNoDependantsClass(row)"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            0
          </span>
        </div>
        
        <!-- Phone Column -->
        <div v-else-if="key === 'phone'" :class="getTextStatusClass(row)">
          {{ formatPhoneNumber(row?.[key]) }}
        </div>

        <!-- Other Columns -->
        <span v-else :class="getTextStatusClass(row)">
          {{ row?.[key] }}
        </span>
      </td>  

      <!-- Actions Column -->
      <td class="p-3 text-left">
        <!-- Dropdown Button - Only show for institution policies (hasInstitution=true) -->
        <button 
          v-if="hasInstitution === 'true' && showActionButtons && actionPage !== 'amend' && actionPage !== 'utilization' && actionPage !== 'history'"
          @click.stop="toggleDropdown($event, getRowId(row))"
          aria-label="Actions"
          class="inline-flex items-center p-2 text-sm font-medium rounded-lg transition-colors focus:outline-none"
          :class="getActionButtonClass(row)"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <!-- Fixed Dropdown Portal (rendered at body level via teleport) -->
        <Teleport to="body" v-if="hasInstitution === 'true' && actionPage !== 'amend' && actionPage !== 'utilization' && actionPage !== 'history' && showActionButtons">
          <div 
            :id="`dropdown-${getRowId(row)}`"
            class="hidden fixed z-[9999] w-48 bg-white rounded-lg ring-1 ring-black ring-opacity-5 shadow-xl dropdown-menu focus:outline-none"
            :class="getDropdownMenuClass(row)"
          >
            <div class="py-1" role="none">
              <button 
                @click.stop="handleEditWithClose(row)"
                class="flex gap-3 items-center px-4 py-2 w-full text-gray-700 rounded-md transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                <i v-html="icons.edits || '✏️'" class="w-5 h-5" />
                Edit
              </button>

              <button
                class="flex gap-3 items-center px-4 py-2 w-full text-gray-700 rounded-md transition-colors hover:bg-blue-50 hover:text-blue-700"
                @click.stop="openModal('AddPackages', {
                  payerInstitutionContractUuid: route.params.id || row?.payerInstitutionContractUuid,
                  insuredUuid: row?.insuredUuid,
                  quotationUuid: row?.quotationUuid,
                  gender: row?.gender,
                })"
              >
                <i v-html="icons.Benefits || '🎁'" class=""></i>
                Benefits
              </button>

              <button 
                @click.stop="$router.push(`/insured_list/detail/${getRowId(row)}`)"
                class="flex gap-3 items-center px-4 py-2 w-full text-gray-700 rounded-md transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                <i v-html="icons.Dependants || '👥'" class="w-5 h-5" />
                Dependents
              </button>
              
              <button
                @click.stop="handleHistoryWithClose(row)"
                class="flex gap-3 items-center px-4 py-2 w-full text-gray-700 rounded-md transition-colors hover:bg-blue-50 hover:text-blue-700"
              >
                <i v-html="icons.historys || '🕘'" class="w-4 h-4 text-gray-700" />
                History
              </button>
            </div>
          </div>
        </Teleport>

        <!-- UTILIZATION PAGE: Only Utilization Action -->
        <div v-if="actionPage === 'utilization'" class="flex flex-row gap-2 items-center">
          <button
            @click.stop="openModal('UtilizeUsage', {
              insuredUuid: row?.insuredUuid || getRowId(row),
              dependantUuid: null,
              payerInstitutionContractUuid: route.params.id || null,
            })"
            class="flex gap-2 items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="getSecondaryButtonClass(row)"
          >
            Utilization
          </button>
        </div>

        <!-- HISTORY PAGE: Only History Action -->
        <div v-if="actionPage === 'history'" class="flex flex-row gap-2 items-center">
          <button
            @click.stop="handleHistoryWithClose(row)"
            class="flex gap-2 items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="getSecondaryButtonClass(row)"
          >
            History
          </button>
        </div>

        <!-- AMEND PAGE: Status Toggle and Actions -->
        <div v-if="actionPage === 'amend'" class="flex flex-row gap-2 items-center">
          <!-- Status Toggle Switch (only for amend page) -->
          <button
            v-if="canToggleStatus(row)"
            @click.stop="toggleStatus(row)"
            class="inline-flex relative items-center w-12 h-7 rounded-full shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="getToggleClass(row)"
            :title="getToggleTitle(row)"
          >
            <span
              class="inline-block flex absolute left-0.5 justify-center items-center w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ease-in-out transform"
              :class="getTogglePositionClass(row)"
            >
              <!-- Icon inside toggle -->
              <svg v-if="isActive(row)" class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <svg v-else class="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </span>
          </button>
        
          <!-- Action Buttons for Amend Page -->
          <button
            @click.stop="$router.push(`/insured_list/detail/${getRowId(row)}?pageContext=amend`)"
            class="flex gap-2 items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="getSecondaryButtonClass(row)"
          >
            <i v-html="icons.Dependants || '👥'" class="w-4 h-4" />
            Dependents
          </button>

          <button
            @click.stop="openModal('AddPackages', {
              payerInstitutionContractUuid: route.params.id  || row?.payerInstitutionContractUuid,
              insuredUuid: row?.insuredUuid,
              quotationUuid: row?.quotationUuid,
              gender: row?.gender,
            })"
            class="flex gap-2 items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="getSecondaryButtonClass(row)"
          >
            <i v-html="icons.Benefits || '🎁'" class="" />
            Benefits
          </button>
        </div>
      </td>
    </tr>

    <!-- Dependents Expansion Row -->
    <tr 
      v-if="expandedRows.has(getRowId(row)) && row?.dependantResponses && row.dependantResponses.length > 0"
      :key="`dependents-${getRowId(row)}`"
      class="border-b transition-all duration-200"
      :class="getExpandedRowClass(row)"
    >
      <td colspan="100%" class="p-6">
        <div class="space-y-4">
          <!-- Header -->
          <div class="flex gap-2 items-center mb-4">
            <svg class="w-5 h-5" :class="getExpandedHeaderIconClass(row)" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <h3 class="text-lg font-semibold" :class="getExpandedHeaderTextClass(row)">
              Dependents ({{ row.dependantResponses.length }})
            </h3>
          </div>

          <!-- Dependents Grid -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DependentRow 
              v-for="dependent in row.dependantResponses"
              :key="dependent?.dependantUuid || dependent?.id"
              :dependent="dependent"
              :insuredUuid="getRowId(row)"
            />
          </div>
        </div>
      </td>
    </tr>
  </template>
</template>

<script setup>
import { defineProps, onMounted, onUnmounted, ref } from 'vue';
import { openModal } from '@customizer/modal-x';
import { insuredMembers } from "../store/insuredPersonsStore";
import { changeInsuredStatus } from "../api/insuredPersonsApi";
import { useToast } from '@/toast/store/toast';
import icons from "@/utils/icons";
import { useRoute, useRouter } from 'vue-router';
import DependentRow from './DependentRow.vue';

const emit = defineEmits(['row', 'remove']);

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  headKeys: { type: Array, required: true },
  cells: { type: [Object, Array], default: () => ({}) },
  isMobile: { type: Boolean, default: false },
  onView: { type: Function, default: () => {} },
  onEdit: { type: Function, default: () => {} },
  onActivate: { type: Function, default: () => {} },
  onDeactivate: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  showActionButtons: { type: Boolean, default: true },
  pageContext: { type: String, default: 'insured' },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 },
  hasInstitution: { type: String, default: 'true' },
});

const route = useRoute();
const router = useRouter();
const payerInstitutionContractUuid = route.params.id || null;
const actionPage = route.query.pageContext;

const { addToast } = useToast();
const insuredStore = insuredMembers();
const expandedRows = ref(new Set());

// Status helper functions
const isActive = (row) => row?.status?.toUpperCase() === 'ACTIVE' || row?.status?.toUpperCase() === 'APPROVED';
const isInactive = (row) => row?.status?.toUpperCase() === 'INACTIVE' || row?.status?.toUpperCase() === 'REJECTED';
const isSuspended = (row) => row?.status?.toUpperCase() === 'SUSPENDED';
const isPending = (row) => row?.status?.toUpperCase() === 'PENDING' || row?.status?.toUpperCase() === 'SUBMITTED';

// MAIN ROW STATUS CLASS - This controls the row background color
function getRowStatusClass(row) {
  const baseClasses = 'bg-white border-b transition-all duration-200 cursor-pointer';
  
  if (isInactive(row)) {
    return `${baseClasses} bg-red-100 hover:bg-red-200 border-red-300`;
  }
  
  if (isSuspended(row)) {
    return `${baseClasses} bg-orange-100 hover:bg-orange-200 border-orange-300`;
  }
  
  if (isPending(row)) {
    return `${baseClasses} bg-yellow-50 hover:bg-yellow-100 border-yellow-200`;
  }
  
  if (isActive(row)) {
    return `${baseClasses} hover:bg-green-50 border-green-200`;
  }
  
  return `${baseClasses} hover:bg-gray-50 border-gray-200`;
}

// Status dot colors
function getStatusDotClass(row) {
  if (isInactive(row)) return 'bg-red-500';
  if (isSuspended(row)) return 'bg-orange-500';
  if (isPending(row)) return 'bg-yellow-500';
  if (isActive(row)) return 'bg-green-500';
  return 'bg-gray-400';
}

// Status ping animation
function getStatusPingClass(row) {
  if (isInactive(row)) return 'bg-red-400';
  if (isSuspended(row)) return 'bg-orange-400';
  if (isPending(row)) return 'bg-yellow-400';
  if (isActive(row)) return 'bg-green-400';
  return 'bg-gray-400';
}

// Text color based on status
function getTextStatusClass(row) {
  if (isInactive(row)) return 'text-red-800';
  if (isSuspended(row)) return 'text-orange-800';
  if (isPending(row)) return 'text-yellow-800';
  if (isActive(row)) return 'text-gray-900';
  return 'text-gray-700';
}

// Muted text color
function getMutedTextStatusClass(row) {
  if (isInactive(row)) return 'text-red-600/70';
  if (isSuspended(row)) return 'text-orange-600/70';
  if (isPending(row)) return 'text-yellow-600/70';
  return 'text-gray-500';
}

// Status badge class
function getStatusBadgeClass(row) {
  const base = "px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5";
  
  if (isInactive(row)) return `${base} bg-red-200 text-red-800 border border-red-300`;
  if (isSuspended(row)) return `${base} bg-orange-200 text-orange-800 border border-orange-300`;
  if (isPending(row)) return `${base} bg-yellow-200 text-yellow-800 border border-yellow-300`;
  if (isActive(row)) return `${base} bg-green-200 text-green-800 border border-green-300`;
  
  return `${base} bg-gray-200 text-gray-800 border border-gray-300`;
}

// Inner dot for status badge
function getStatusInnerDotClass(row) {
  if (isInactive(row)) return 'bg-red-600';
  if (isSuspended(row)) return 'bg-orange-600';
  if (isPending(row)) return 'bg-yellow-600';
  if (isActive(row)) return 'bg-green-600';
  return 'bg-gray-600';
}

// Status text for toggle
function getStatusTextClass(row) {
  if (isInactive(row)) return 'text-red-700';
  if (isSuspended(row)) return 'text-orange-700';
  if (isPending(row)) return 'text-yellow-700';
  if (isActive(row)) return 'text-green-700';
  return 'text-gray-700';
}

// Image border class
function getImageBorderClass(row) {
  if (isInactive(row)) return 'border-red-300';
  if (isSuspended(row)) return 'border-orange-300';
  if (isPending(row)) return 'border-yellow-300';
  if (isActive(row)) return 'border-green-300';
  return 'border-gray-200';
}

// Dependents button class
function getDependantsButtonClass(row, isExpanded) {
  if (isExpanded) {
    return 'bg-blue-600 text-white hover:bg-blue-700';
  }
  
  if (isInactive(row)) {
    return 'bg-red-200 text-red-800 hover:bg-red-300 border border-red-300';
  }
  
  if (isSuspended(row)) {
    return 'bg-orange-200 text-orange-800 hover:bg-orange-300 border border-orange-300';
  }
  
  return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200';
}

// No dependents class
function getNoDependantsClass(row) {
  if (isInactive(row)) {
    return 'bg-red-100 text-red-600 border border-red-200';
  }
  if (isSuspended(row)) {
    return 'bg-orange-100 text-orange-600 border border-orange-200';
  }
  return 'bg-gray-100 text-gray-600 border border-gray-200';
}

// Action button class
function getActionButtonClass(row) {
  if (isInactive(row)) {
    return 'text-red-600 hover:text-red-800 hover:bg-red-200';
  }
  if (isSuspended(row)) {
    return 'text-orange-600 hover:text-orange-800 hover:bg-orange-200';
  }
  return 'text-gray-500 hover:text-gray-800 hover:bg-gray-100';
}

// Dropdown menu class
function getDropdownMenuClass(row) {
  if (isInactive(row)) {
    return 'border border-red-200';
  }
  return '';
}

// Toggle class
function getToggleClass(row) {
  if (isActive(row)) {
    return 'bg-green-500 hover:bg-green-600 focus:ring-green-500';
  }
  return 'bg-red-400 hover:bg-red-500 focus:ring-red-500';
}

// Toggle position class
function getTogglePositionClass(row) {
  return isActive(row) ? 'translate-x-5' : 'translate-x-0';
}

// Toggle title
function getToggleTitle(row) {
  return isActive(row) ? 'Click to deactivate' : 'Click to activate';
}

// Check if status can be toggled
function canToggleStatus(row) {
  return isActive(row) || isInactive(row) || isSuspended(row);
}

// Secondary button class for amend page
function getSecondaryButtonClass(row) {
  if (isInactive(row)) {
    return 'text-red-700 bg-red-100 hover:bg-red-200 border border-red-200';
  }
  if (isSuspended(row)) {
    return 'text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-200';
  }
  return 'text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200';
}

// Expanded row class
function getExpandedRowClass(row) {
  if (isInactive(row)) {
    return 'bg-red-50 border-red-200';
  }
  if (isSuspended(row)) {
    return 'bg-orange-50 border-orange-200';
  }
  return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
}

// Expanded header icon class
function getExpandedHeaderIconClass(row) {
  if (isInactive(row)) return 'text-red-600';
  if (isSuspended(row)) return 'text-orange-600';
  return 'text-blue-600';
}

// Expanded header text class
function getExpandedHeaderTextClass(row) {
  if (isInactive(row)) return 'text-red-900';
  if (isSuspended(row)) return 'text-orange-900';
  return 'text-gray-900';
}

// Toggle status function
async function toggleStatus(row) {
  const insuredId = getRowId(row);
  
  if (isActive(row)) {
    await handleDeactivateWithClose(insuredId);
  } else if (isInactive(row) || isSuspended(row)) {
    await handleActivateWithClose(insuredId);
  }
}

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) return `+251 ${digits.slice(1)}`;
  if (digits.startsWith('251') && digits.length === 12) return `+251 ${digits.slice(3)}`;
  if (digits.startsWith('9') && digits.length === 9) return `+251 ${digits}`;
  return phone;
}

function getBaseUrl() {
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
}

function genderFallbackUrl(gender) {
  const g = String(gender || '').trim().toLowerCase();
  if (g.includes('female')) return '/src/assets/img/female.png';
  if (g.includes('male')) return '/src/assets/img/male.png';
  return '/src/assets/img/profile.png';
}

function handleImageError(event) {
  const row = event.target.__vueParentComponent?.ctx?.row;
  event.target.src = row ? genderFallbackUrl(row.gender) : '/src/assets/img/profile.png';
}

function handleEdit(row) {
  if (row.insuredUuid) {
    openModal('EditInsured', { 
      insuredUuid: row.insuredUuid, 
      insured: row,
      photo: row.profile || row.photoBase64 || row.photoUrl || row.photoPath,
      onUpdated: (updatedInsured) => {
        insuredStore.update(updatedInsured.insuredUuid, updatedInsured);
      }
    });
  } else if (typeof props.onEdit === 'function') {
    props.onEdit(row);
  }
}

function handleHistoryWithClose(row) {
  const insuredUuid = row?.insuredUuid || row?.id || row?.uuid || null;
  const contractUuid = route?.params?.contractUuid || route?.query?.contractUuid || route?.params?.id || null;
  const institutionUuid = route?.params?.institutionUuid || route?.query?.institutionUuid || null;

  openModal('InsuredHistory', {
    insuredUuid,
    contractUuid,
    institutionUuid,
  });
}

function getRowId(row) {
  if (!row) return null;
  return row.insuredUuid || row.id || row.uuid || null;
}

function getRowKey(row, idx) {
  const rowId = getRowId(row);
  return rowId ? rowId : `row-${idx}`;
}

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (!dropdown) return;

  const btn = event.currentTarget;
  const rect = btn.getBoundingClientRect();
  const dropdownHeight = 180;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < dropdownHeight + 8;

  const right = window.innerWidth - rect.right;
  dropdown.style.right = `${right}px`;
  dropdown.style.left = 'auto';

  if (openUpward) {
    dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    dropdown.style.top = 'auto';
  } else {
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.bottom = 'auto';
  }

  dropdown.classList.remove('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.add('hidden'));
}

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});

function handleEditWithClose(row) {
  closeAllDropdowns();
  handleEdit(row);
}

async function handleActivateWithClose(insuredId) {
  if (!insuredId) {
    addToast({ type: 'error', title: 'Error', message: 'Invalid insured ID' });
    return;
  }
  
  closeAllDropdowns();
  try {
    const response = await changeInsuredStatus(insuredId, 'ACTIVE');
    if (response.success) {
      addToast({ type: 'success', title: 'Status Updated', message: 'Insured member has been activated' });
      insuredStore.update(insuredId, { status: 'ACTIVE' });
    } else throw new Error(response.error || 'Failed to activate');
  } catch (error) {
    addToast({ type: 'error', title: 'Activation Failed', message: error.message || 'Failed to activate insured member' });
  }
}

async function handleDeactivateWithClose(insuredId) {
  if (!insuredId) {
    addToast({ type: 'error', title: 'Error', message: 'Invalid insured ID' });
    return;
  }
  
  closeAllDropdowns();
  try {
    const response = await changeInsuredStatus(insuredId, 'SUSPENDED');
    if (response.success) {
      addToast({ type: 'success', title: 'Status Updated', message: 'Insured member has been deactivated' });
      insuredStore.update(insuredId, { status: 'SUSPENDED' });
    } else throw new Error(response.error || 'Failed to deactivate');
  } catch (error) {
    addToast({ type: 'error', title: 'Deactivation Failed', message: error.message || 'Failed to deactivate insured member' });
  }
}

function toggleRowExpansion(rowId) {
  if (!rowId) return;
  if (expandedRows.value.has(rowId)) {
    expandedRows.value.delete(rowId);
  } else {
    expandedRows.value.add(rowId);
  }
}

function getGenderIcon(gender) {
  return gender?.toLowerCase() === 'female' ? '👩' : '👨';
}
</script>

<style scoped>
/* Smooth transitions */
tr {
  transition: all 0.2s ease-in-out;
}

/* Hover effects for status rows */
tr.bg-red-100:hover {
  background-color: #fee2e2 !important;
}

tr.bg-orange-100:hover {
  background-color: #fed7aa !important;
}

tr.bg-yellow-50:hover {
  background-color: #fef9c3 !important;
}

/* Dropdown menu styles */
.dropdown-menu {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top right;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  border-radius: 0.375rem;
  overflow: hidden;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* Dropdown Items */
.dropdown-menu button {
  padding: 0.5rem 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: white;
  text-align: left;
  transition: background-color 0.15s ease;
  border: none;
}

.dropdown-menu button:hover {
  background-color: #eff6ff;
  color: #1d4ed8;
}

.dropdown-menu button.text-red-600:hover {
  background-color: #fef2f2;
  color: #dc2626;
}

/* Pulse animation for status dots */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* Button press effect */
button:active {
  transform: translateY(1px);
}

/* Focus styles */
button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Custom scrollbar for expanded sections */
.grid {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.grid::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.grid::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.grid::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.grid::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>