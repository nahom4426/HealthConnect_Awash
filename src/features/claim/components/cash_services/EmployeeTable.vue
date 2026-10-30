<script setup>
import PersonAvatar from "@/components/PersonAvatar.vue";
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

</script>

<template>
  <div class="flex overflow-hidden flex-col flex-1 bg-white rounded-xl border shadow-sm">
    <div class="overflow-auto" style="max-height: calc(100vh - 550px); min-height: 400px;">
      <table class="min-w-full divide-y divide-line">
        <thead class="sticky top-0 z-10 bg-gradient-to-r from-surface-muted to-surface-muted">
          <tr>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">#</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">Employee ID</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">Name</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">Phone</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">Type</th>
            <th class="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-ink-muted uppercase tracking-wider border-b border-line">Action</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-line">
          <template v-if="props.employees.length > 0">
            <template v-for="(employee, index) in props.employees" :key="employee.insuredUuid">
              <tr :class="{
                'bg-gradient-to-r from-teal-50 to-cyan-50 border-l-4 border-teal-400': props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid,
                'hover:bg-gradient-to-r hover:from-surface-muted hover:to-primary/5 transition-all duration-200': !(props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid)
              }" class="cursor-pointer group"
                tabindex="0"
                :aria-selected="!!(props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid && !props.selectedEmployee.dependantUuid)"
                @click="selectEmployee(employee)"
                @keydown.enter.prevent="selectEmployee(employee)"
                @keydown.space.prevent="selectEmployee(employee)">
                <td class="px-3 py-3 text-xs text-ink-subtle whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <div class="flex justify-center items-center w-6 h-6 text-xs font-semibold text-primary bg-primary/10 rounded-full transition-colors sm:w-8 sm:h-8 sm:text-sm group-hover:bg-primary/20">
                    {{ index + 1 }}
                  </div>
                </td>
                <td class="px-3 py-3 text-xs font-medium text-ink whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <div class="flex items-center space-x-1 sm:space-x-2">
                    <div class="flex-shrink-0 w-1.5 h-1.5 bg-success rounded-full sm:w-2 sm:h-2"></div>
                    <span class="truncate">{{ employee.idNumber }}</span>
                  </div>
                </td>
                <td class="px-3 py-3 text-xs text-ink-subtle whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <div class="flex items-center space-x-2 sm:space-x-3">
                    <PersonAvatar :photo="employee.profile" :gender="employee.gender" alt="Profile" class="w-6 h-6 rounded-full border shrink-0 border-line sm:w-8 sm:h-8" />
                    <span class="font-medium text-ink truncate max-w-[120px] sm:max-w-none">
                      {{ employee.firstName }} {{ employee.fatherName || '' }} {{ employee.grandFatherName || '' }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-3 text-xs text-ink-muted whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  {{ employee.phone || '-' }}
                </td>
                <td class="px-3 py-3 text-xs whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <span class="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-primary/10 to-primary/20 text-primary-hover border border-primary/30">
                    Employee
                  </span>
                </td>
                <td class="px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                  <button type="button" @click.stop="selectEmployee(employee)"
                    :class="{
                      'bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg transform scale-105': props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid,
                      'bg-gradient-to-r from-surface-muted to-line text-ink-muted hover:from-primary hover:to-teal-600 hover:text-white hover:shadow-md transform hover:scale-105': !(props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid)
                    }"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm">
                    {{ props.selectedEmployee && props.selectedEmployee.insuredUuid === employee.insuredUuid ? 'Selected' : 'Select' }}
                  </button>
                </td>
              </tr>

              <!-- Dependants -->
              <template v-if="employee.__dependants && employee.__dependants.length > 0">
                <tr v-for="(dependant, dIndex) in employee.__dependants" :key="dependant.dependantUuid"
                  tabindex="0"
                  @click="selectEmployee(dependant)"
                  @keydown.enter.prevent="selectEmployee(dependant)"
                  @keydown.space.prevent="selectEmployee(dependant)"
                  :class="{
                    'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400': props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid,
                    'bg-gradient-to-r from-blue-25 to-indigo-25 hover:from-primary/5 hover:to-primary/5': !(props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid)
                  }" class="transition-all duration-200 cursor-pointer group">
                  <td class="px-3 py-3 pl-6 text-xs text-ink-subtle whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm sm:pl-10">
                    <div class="flex items-center space-x-1 sm:space-x-2">
                      <span class="text-xs font-bold text-purple-600 sm:text-sm">↳</span>
                      <div class="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-purple-100 rounded-full text-purple-600 font-semibold text-[10px] sm:text-xs">
                        {{ dIndex + 1 }}
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-xs text-ink-subtle whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <div class="flex items-center space-x-1 sm:space-x-2">
                      <div class="flex-shrink-0 w-1.5 h-1.5 bg-purple-400 rounded-full sm:w-2 sm:h-2"></div>
                      <span class="truncate">{{ dependant.idNumber || employee.idNumber }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-3 pl-2 text-xs text-ink-subtle whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <div class="flex items-center space-x-2 sm:space-x-3">
                      <PersonAvatar :photo="dependant.profile" :gender="dependant.gender" alt="Profile" class="w-6 h-6 rounded-full border shrink-0 border-line sm:w-8 sm:h-8" />
                      <div class="flex flex-col min-w-0">
                        <span class="font-medium text-ink truncate max-w-[120px] sm:max-w-none">
                          {{ dependant.firstName }} {{ dependant.fatherName || '' }} {{ dependant.grandFatherName || '' }}
                        </span>
                        <span class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                          {{ dependant.relationship }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-xs text-ink-muted whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    {{ dependant.phone || '-' }}
                  </td>
                  <td class="px-3 py-3 text-xs whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <span class="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-gradient-to-r from-primary/10 to-purple-200 text-primary-hover border border-primary/30">
                      Dependant
                    </span>
                  </td>
                  <td class="px-3 py-3 text-xs font-medium whitespace-nowrap sm:px-4 lg:px-6 sm:py-4 sm:text-sm">
                    <button type="button" @click.stop="selectEmployee(dependant)"
                      :class="{
                        'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg transform scale-105': props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid,
                        'bg-gradient-to-r from-surface-muted to-line text-ink-muted hover:from-purple-500 hover:to-pink-600 hover:text-white hover:shadow-md transform hover:scale-105': !(props.selectedEmployee && props.selectedEmployee.dependantUuid === dependant.dependantUuid)
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
                  <h3 class="text-lg font-semibold text-ink">No employees found</h3>
                  <p class="text-sm text-ink-subtle">
                    {{ props.searchEmployeeQuery
                      ? 'No matching employees found for your search'
                      : 'Search for employees to see results' }}
                  </p>
                  <button v-if="props.searchEmployeeQuery"
                    @click="emit('clear-search')"
                    class="px-3 py-1 mt-2 text-sm font-medium text-ink-muted bg-white rounded-md border border-line-strong hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
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
  color: rgb(var(--ink-muted));
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
