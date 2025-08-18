<script setup>
import Table from "@/components/Table.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { useAuthStore } from "@/stores/auth";
import { computed, onMounted, ref, watch } from "vue";
import InsuredPersonsDataProvider from "../components/InsuredPersonsDataProvider.vue";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { closeModal } from "@customizer/modal-x";
import { addMembersToGroup } from "../api/groupServiceApi";
import { toasted } from "@/utils/utils";
import Spinner from "@/components/Spinner.vue";
import Pagination from "@/components/Pagination.vue";
import { useRoute } from "vue-router";

const route = useRoute();
const api = useApiRequest();
const props = defineProps({
  data: String,
});

const auth = useAuthStore();
const institutionId = ref(auth.auth?.user?.payerUuid || "");
const search = ref("");
const searchTimeout = ref(null);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(25);
const itemsPerPageOptions = [10, 25, 50, 70, 100];
const totalItems = ref(0);
const allMembers = ref([]);
const isLoading = ref(false);

// Selection management
const isSelected = ref(false);
const selected = ref([]);
const allSelectedOnPage = ref(false);

// Computed properties
const filteredMembers = computed(() => {
  if (!search.value) return allMembers.value;
  
  const term = search.value.toLowerCase();
  return allMembers.value.filter(member => 
    (member.firstName?.toLowerCase().includes(term) ||
    member.fatherName?.toLowerCase().includes(term) ||
    member.idNumber?.toLowerCase().includes(term) ||
    member.phone?.toLowerCase().includes(term))
  );
});

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredMembers.value.slice(start, end);
});

// Watch for changes in filtered members to update totalItems
watch(filteredMembers, (newVal) => {
  totalItems.value = newVal.length;
}, { immediate: true });

// Methods
function handleSelectAll(checked) {
  if (checked) {
    paginatedMembers.value.forEach(item => {
      if (item?.insuredUuid && !selected.value.includes(item.insuredUuid)) {
        selected.value.push(item.insuredUuid);
      }
    });
    allSelectedOnPage.value = true;
  } else {
    const pageItemIds = paginatedMembers.value.map(item => item.insuredUuid);
    selected.value = selected.value.filter(id => !pageItemIds.includes(id));
    allSelectedOnPage.value = false;
  }
  isSelected.value = selected.value.length === filteredMembers.value.length;
}

function selectService(id) {
  const idx = selected.value.findIndex(el => el === id);
  if (idx > -1) {
    selected.value.splice(idx, 1);
    allSelectedOnPage.value = false;
    isSelected.value = false;
  } else {
    selected.value.push(id);
    allSelectedOnPage.value = paginatedMembers.value.every(item => 
      selected.value.includes(item.insuredUuid)
    );
    isSelected.value = selected.value.length === filteredMembers.value.length;
  }
}

async function handleAddMembersToGroup() {
  if (selected.value.length === 0) {
    toasted(false, "", "Please select at least one member");
    return;
  }
  
  try {
    const res = await api.send(
      () => addMembersToGroup(props.data.allowedUuid, selected.value)
    );
    
    if (res?.success) {
      toasted(true, "Success", "Members added to group successfully");
      closeModal(true);
    } else {
      throw new Error(res?.error || "Failed to add members");
    }
  } catch (error) {
    console.error("Error adding members:", error);
    toasted(false, "Error", error.message || "Failed to add members");
  }
}

function handlePageChange(page) {
  currentPage.value = page;
  allSelectedOnPage.value = false;
}

function handleSearch() {
  clearTimeout(searchTimeout.value);
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1;
  }, 500);
}

function handleItemsPerPageChange(newSize) {
  itemsPerPage.value = newSize;
  currentPage.value = 1;
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="lg"
      title="Add Members To Group"
      subtitle="Select members to add to your group"
    >
      <InsuredPersonsDataProvider
        :institutionId="institutionId"
        :search="search"
        v-slot="{ insuredMembers, pending }"
      >
        <div 
          class="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm"
          v-if="insuredMembers"
        >
          <!-- Update allMembers when insuredMembers changes -->
          <div v-show="false">{{ allMembers = insuredMembers }}</div>
          
          <!-- Search and Selection Header -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-700">
                Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, totalItems) }}-
                {{ Math.min(currentPage * itemsPerPage, totalItems) }} of {{ totalItems }}
              </span>
              <span 
                v-if="selected.length > 0"
                class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {{ selected.length }} selected
              </span>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="relative w-full md:w-96">
                <input
                  v-model="search"
                  @input="handleSearch"
                  placeholder="Search members by name, ID or phone..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition"
                  type="text"
                />
                <div class="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <select
                v-model="itemsPerPage"
                @change="handleItemsPerPageChange(Number($event.target.value))"
                class="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                  {{ option }} per page
                </option>
              </select>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="pending" class="flex justify-center py-8">
            <Spinner size="lg" />
          </div>

          <!-- Members Table -->
          <div v-else class="border border-gray-200 rounded-lg overflow-hidden">
            <Table
              :firstCol="true"
              :rows="paginatedMembers"
              :show-pagination="false"
              :headers="{
                head: ['Select', 'Full Name', 'ID Number', 'Phone', 'Position', 'Status'],
                row: ['select', 'fullName', 'idNumber', 'phone', 'position', 'status'],
              }"
              :cells="{
                fullName: (_, row) => `${row?.firstName} ${row?.fatherName}`,
                status: (_, row) => row.status === 'ACTIVE' ? 'Active' : 'Inactive'
              }"
              class="min-w-full divide-y divide-gray-200"
            >
              <template #headerFirst>
                <input
                  :checked="allSelectedOnPage"
                  @change="handleSelectAll($event.target.checked)"
                  class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  type="checkbox"
                />
              </template>
              
              <template #select="{ row }">
                <input
                  type="checkbox"
                  :checked="selected.includes(row?.insuredUuid)"
                  @change="selectService(row?.insuredUuid)"
                  class="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </template>
            </Table>
          </div>

          <!-- Pagination -->
          <Pagination
            v-if="totalItems > itemsPerPage"
            :current-page="currentPage"
            :total-items="totalItems"
            :items-per-page="itemsPerPage"
            @page-change="handlePageChange"
            class="mt-4"
          />

          <!-- Action Buttons -->
          <div class="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <Button
              @click="closeModal()"
              variant="outline"
              class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>

            <Button
              :pending="api.pending.value"
              :disabled="selected.length === 0"
              @click="handleAddMembersToGroup"
              class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Selected Members ({{ selected.length }})
            </Button>
          </div>
        </div>
      </InsuredPersonsDataProvider>
    </NewFormParent>
  </ModalParent>
</template>

<style scoped>
input[type="checkbox"] {
  transition: all 0.2s ease;
}

.table-container::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

tbody tr:hover {
  background-color: #f8fafc;
}
</style>