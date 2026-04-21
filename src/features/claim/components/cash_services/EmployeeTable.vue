<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  employees: { type: Array, default: () => [] },
  selectedEmployee: { type: Object, default: null },
  searchEmployeeQuery: { type: String, default: '' }
});

const emit = defineEmits(['select-employee', 'clear-search']);

function selectEmployee(row) {
  emit('select-employee', row);
}

// Format profile image source to handle both URLs and base64
const formatImageSource = (profile) => {
  if (!profile) return '';
  
  // Check if it's a base64 string (starts with iVBOR for PNG or /9j/ for JPEG)
  const isBase64 = profile.startsWith('iVBOR') || profile.startsWith('/9j/');
  
  // If it's base64, add the data URL prefix, otherwise return as is
  return isBase64 ? `data:image/png;base64,${profile}` : profile;
};
</script>

<template>
  <div class="flex overflow-hidden flex-col flex-1 bg-white rounded-xl border shadow-sm">
    <div class="overflow-auto" style="max-height: calc(100vh - 550px); min-height: 400px;">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">#</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Employee ID</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Name</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Phone</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Type</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Action</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-100">
          <template v-if="props.employees.length > 0">
            <template v-for="(employee, index) in props.employees" :key="employee.insuredUuid">
              <tr :class="{
                'bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-400': props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid,
                'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200': !(props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid)
              }" class="cursor-pointer group">
                <td class="px-3 py-3 text-xs text-gray-500 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <div class="flex justify-center items-center w-6 h-6 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full transition-colors sm:w-8 sm:h-8 sm:text-sm group-hover:bg-blue-200">
                    {{ index + 1 }}
                  </div>
                </td>
                <td class="px-3 py-3 text-xs font-medium text-gray-900 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <div class="flex items-center space-x-1 sm:space-x-2">
                    <div class="flex-shrink-0 w-1.5 h-1.5 bg-green-400 rounded-full sm:w-2 sm:h-2"></div>
                    <span class="truncate">{{ employee.idNumber }}</span>
                  </div>
                </td>
                <td class="px-3 py-3 text-xs text-gray-500 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <div class="flex items-center space-x-2 sm:space-x-3">
                    <template v-if="employee.profile">
                      <img :src="formatImageSource(employee.profile)" alt="Profile" class="object-cover w-6 h-6 rounded-full border border-gray-200 sm:w-8 sm:h-8" />
                    </template>
                    <template v-else>
                      <div class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs">
                        {{ (employee.firstName || '').charAt(0).toUpperCase() }}
                      </div>
                    </template>
                    <span class="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                      {{ employee.firstName }} {{ employee.fatherName || '' }} {{ employee.grandFatherName || '' }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-3 text-xs text-gray-600 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  {{ employee.phone || '-' }}
                </td>
                <td class="px-3 py-3 text-xs whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <span class="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                    Employee
                  </span>
                </td>
                <td class="px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <button type="button" @click="selectEmployee(employee)"
                    :class="{
                      'bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg transform scale-105': props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid,
                      'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-primary hover:to-teal-600 hover:text-white hover:shadow-md transform hover:scale-105': !(props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid)
                    }"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm">
                    {{ props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid ? 'Selected' : 'Select' }}
                  </button>
                </td>
              </tr>

              <!-- Dependants -->
              <template v-if="employee.__dependants && employee.__dependants.length > 0">
                <tr v-for="(dependant, dIndex) in employee.__dependants" :key="dependant.dependantUuid"
                  :class="{
                    'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400': props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid,
                    'bg-gradient-to-r from-blue-25 to-indigo-25 hover:from-blue-50 hover:to-indigo-50': !(props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid)
                  }" class="transition-all duration-200 cursor-pointer group">
                  <td class="px-3 py-3 pl-6 text-xs text-gray-500 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm sm:pl-10">
                    <div class="flex items-center space-x-1 sm:space-x-2">
                      <span class="text-xs font-bold text-purple-600 sm:text-sm">↳</span>
                      <div class="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 rounded-full text-purple-600 font-semibold text-[10px] sm:text-xs">
                        {{ dIndex + 1 }}
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-xs text-gray-500 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <div class="flex items-center space-x-1 sm:space-x-2">
                      <div class="flex-shrink-0 w-1.5 h-1.5 bg-purple-400 rounded-full sm:w-2 sm:h-2"></div>
                      <span class="truncate">{{ dependant.idNumber || employee.idNumber }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-3 pl-2 text-xs text-gray-500 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <div class="flex items-center space-x-2 sm:space-x-3">
                      <template v-if="dependant.profile">
                        <img :src="formatImageSource(dependant.profile)" alt="Profile" class="object-cover w-6 h-6 rounded-full border border-gray-200 sm:w-8 sm:h-8" />
                      </template>
                      <template v-else>
                        <div class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-xs">
                          {{ (dependant.firstName || '').charAt(0).toUpperCase() }}
                        </div>
                      </template>
                      <div class="flex flex-col min-w-0">
                        <span class="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                          {{ dependant.firstName }} {{ dependant.fatherName || '' }} {{ dependant.grandFatherName || '' }}
                        </span>
                        <span class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                          {{ dependant.relationship }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-xs text-gray-600 whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    {{ dependant.phone || '-' }}
                  </td>
                  <td class="px-3 py-3 text-xs whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <span class="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-200 text-indigo-800 border border-indigo-300">
                      Dependant
                    </span>
                  </td>
                  <td class="px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <button type="button" @click="selectEmployee(dependant)"
                      :class="{
                        'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105': props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid,
                        'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-purple-500 hover:to-pink-600 hover:text-white hover:shadow-md transform hover:scale-105': !(props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid)
                      }"
                      class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm">
                      {{ props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid ? 'Selected' : 'Select' }}
                    </button>
                  </td>
                </tr>
              </template>
            </template>
          </template>
          <template v-else>
            <tr>
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="flex flex-col justify-center items-center space-y-3">
                  <div class="text-4xl">🧑‍⚕️🔍</div>
                  <h3 class="text-lg font-semibold text-gray-900">No employees found</h3>
                  <p class="text-sm text-gray-500">
                    {{ props.searchEmployeeQuery
                      ? 'No matching employees found for your search'
                      : 'Search for employees to see results' }}
                  </p>
                  <button v-if="props.searchEmployeeQuery"
                    @click="emit('clear-search')"
                    class="px-3 py-1 mt-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    Clear search
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 1rem;
  padding-bottom: 1rem;
  white-space: nowrap;
  font-size: 0.875rem;
}
</style>
