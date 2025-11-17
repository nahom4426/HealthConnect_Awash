<script setup>
import { ref, onMounted, watch } from 'vue';
import { useApiRequest } from "@/composables/useApiRequest";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import PolicyStatusRow from "@/components/PolicyStatusRow.vue";
import icons from "@/utils/icons";

const apiRequest = useApiRequest();
const institutions = ref([]);
const loading = ref(false);
const deleteLoading = ref(false);
const institutionToDelete = ref("");
const statusFilter = ref('ACTIVE');

// Fetch institutions with search and status filters
const fetchInstitutions = async (searchKey = '', status = statusFilter.value) => {
  loading.value = true;
  try {
    const response = await apiRequest.get(
      `/institution/policy-holders/list?search=${searchKey}&page=1&limit=25&status=${status}`
    );
    institutions.value = response.data;
  } catch (error) {
    console.error("Failed to fetch policies:", error);
  } finally {
    loading.value = false;
  }
};

const handleDeleteInstitution = async (id) => {
  deleteLoading.value = true;
  try {
    await apiRequest.delete(`/institution/${id}`);
    await fetchInstitutions();
  } catch (error) {
    console.error("Failed to delete policy:", error);
  } finally {
    deleteLoading.value = false;
    institutionToDelete.value = "";
  }
};

// Watch for search and status changes
watch(statusFilter, (newStatus) => {
  fetchInstitutions('', newStatus);
});

onMounted(() => {
  fetchInstitutions();
});
</script>

<template>
  <DefaultPage 
    placeholder="Search Issued Policies"
    :show-filter="false"
  >
    <template #filter>
      <div class="flex items-center gap-4">
        <select 
          v-model="statusFilter"
          class="text-sm rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary"
        >
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="HISTORY">History</option>
        </select>
      </div>
    </template>

    <template #default="{ search }">
      <Table
        :pending="loading"
        :headers="{
          head: [
            'Policy Name',
            'Policy Number',
            'Holder',
            'Start Date',
            'End Date',
            'Status',
            'Actions'
          ],
          row: [
            'policyName',
            'policyNumber',
            'holderName',
            'startDate',
            'endDate',
            'status'
          ]
        }"
        :rows="institutions"
        :rowCom="PolicyStatusRow"
      >
        <template #row>
          <PolicyStatusRow
            :rowData="institutions"
            :rowKeys="['policyName', 'policyNumber', 'holderName', 'startDate', 'endDate', 'status']"
            :onDelete="(id) => institutionToDelete = id"
          />
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <div class="flex flex-col items-center justify-center">
              <i v-html="icons.document"></i>
              <p class="text-gray-500">No policies found</p>
              <p v-if="search" class="text-sm text-gray-400 mt-1">
                No results match your search criteria
              </p>
            </div>
          </div>
        </template>
      </Table>
    </template>
  </DefaultPage>

  <!-- Delete Confirmation Modal -->
  <div v-if="institutionToDelete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-md w-full">
      <h3 class="text-lg font-medium mb-4">Confirm Deletion</h3>
      <p class="mb-6">Are you sure you want to delete this policy?</p>
      <div class="flex justify-end space-x-3">
        <button 
          @click="institutionToDelete = ''" 
          class="px-4 py-2 border border-gray-300 rounded-md"
        >
          Cancel
        </button>
        <button 
          @click="handleDeleteInstitution(institutionToDelete)" 
          class="px-4 py-2 bg-red-600 text-white rounded-md"
          :disabled="deleteLoading"
        >
          <span v-if="deleteLoading">Deleting...</span>
          <span v-else>Delete</span>
        </button>
      </div>
    </div>
  </div>
</template>