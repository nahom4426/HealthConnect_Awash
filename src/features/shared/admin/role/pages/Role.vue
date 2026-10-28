<script setup>
import { ref, computed } from 'vue';
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import icons from "@/utils/icons";
import RolesDataProvider from '../components/RolesDataProvider.vue';
import RoleRow from '../components/RoleRow.vue';
import { removeRoleById } from '../Api/RoleApi';
import { useApiRequest } from '@/composables/useApiRequest';
import { toasted } from '@/utils/utils';
import { useRouter } from 'vue-router';
const router = useRouter();
const deleteReq = useApiRequest();

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);
const totalElements = ref(0);

function handleDelete(id) {
  const roleUuid = typeof id === 'object' && id !== null ? (id.roleUuid || id.id) : id;
  if (!roleUuid) {
    toasted(false, "", "Invalid role id");
    return;
  }
  if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
    deleteReq.send(
      () => removeRoleById(roleUuid),
      (res) => {
        if (res.success) {
          toasted(true, "Role deleted successfully");
          if (dataProvider.value) {
            dataProvider.value.refresh();
          }
        } else {
          toasted(false, "", res.error || "Failed to delete role");
        }
      }
    );
  }
}

function handleEdit(row) {
  router.push(`/edit_role/${row.roleUuid}`);
}

function handleDetail(row) {
  router.push(`/role_detail/${row.roleUuid}`);
}

const dataProvider = ref(null);

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(totalElements.value / itemsPerPage.value) || 1;
});

const pageNumbers = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (current > 4) {
      pages.push('...');
    }
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }
    
    if (current < total - 3) {
      pages.push('...');
    }
    
    if (total > 1) {
      pages.push(total);
    }
  }
  
  return pages;
});

function handlePageChange(pageNum) {
  currentPage.value = pageNum;
}

function handlePreviousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function handleNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function handlePerPageChange(newPerPage) {
  itemsPerPage.value = parseInt(newPerPage);
  currentPage.value = 1;
}
</script>

<template>
   <DefaultPage  placeholder="Search Roles">
  <!-- <template #filter>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 bg-gray-100 rounded-md text-primary"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template> -->

    <template #add-action>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
        @click.prevent="$router.push('/create-role')"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Role</p>
      </button>
    </template>

    <template #default="{ search }">
      <RolesDataProvider
        ref="dataProvider"
        :search="search"
        v-slot="{ roles, pending }"
      >
        <Table
          :pending="pending"
          :showPagination="false"
          :rowCom="RoleRow"
          :headers="{
            head: ['Role Name', 'Description', 'Privileges', 'Actions'],
            row: ['roleName', 'roleDescription', 'rolePrivileges']
          }"
          :rows="roles || []"
          placeholder="There are no roles to display at the moment."
          :cells="{
            onEdit: handleEdit,
            onDelete: handleDelete,
            onDetail: handleDetail,
          }"
        />

        <!-- Pagination Section -->
        <div v-if="roles && roles.length > 0" class="flex flex-col gap-3 p-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
          <!-- Mobile-first layout -->
          <div class="flex flex-col gap-3 justify-between items-center sm:flex-row">
            <div class="flex gap-2 items-center text-xs text-gray-600 sm:text-sm">
              <span>Show</span>
              <select
                @change="handlePerPageChange($event.target.value)"
                class="px-2 py-1 text-xs bg-white rounded-md border border-gray-300 transition-all sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :value="itemsPerPage"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="75">75</option>
                <option value="100">100</option>
              </select>
              <span>entries</span>
            </div>
            
            <div v-if="totalElements > 0" class="text-xs text-center text-gray-600 sm:text-sm sm:text-left">
              Showing {{ ((currentPage - 1) * itemsPerPage + 1) }} to {{ Math.min(currentPage * itemsPerPage, totalElements) }} of {{ totalElements }} records
            </div>
          </div>
          
          <!-- Pagination Controls -->
          <div class="flex gap-1 justify-center items-center">
            <button
              @click="handlePreviousPage"
              class="pagination-btn"
              :disabled="currentPage === 1 || pending"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 || pending }"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            
            <button
              v-for="pageNum in pageNumbers"
              :key="pageNum"
              @click="pageNum !== '...' ? handlePageChange(pageNum) : null"
              class="pagination-btn"
              :class="{ 'pagination-btn-active': currentPage === pageNum }"
              :disabled="pageNum === '...' || pending"
            >
              {{ pageNum }}
            </button>
            
            <button
              @click="handleNextPage"
              class="pagination-btn"
              :disabled="currentPage === totalPages || pending"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages || pending }"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </RolesDataProvider>
    </template>
  </DefaultPage>
  </template>

<style scoped>
/* Modern pagination button styles */
.pagination-btn {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn-active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.pagination-btn-active:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}

@media (max-width: 640px) {
  .pagination-btn {
    min-width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}
</style>
