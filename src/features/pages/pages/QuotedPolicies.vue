<script setup>
import { ref, onMounted } from 'vue';
import { useApiRequest } from "@/composables/useApiRequest";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import QuotedPolicyRow from "@/components/QuotedPolicyRow.vue";
import icons from "@/utils/icons";

const apiRequest = useApiRequest();
const policies = ref([]);
const loading = ref(false);
const deleteLoading = ref(false);
const policyToDelete = ref("");

const fetchPolicies = async () => {
  loading.value = true;
  try {
    const response = await apiRequest.get("/payer-institution-contract/list/pending/policies");
    policies.value = response.data;
  } catch (error) {
    console.error("Failed to fetch quoted policies:", error);
  } finally {
    loading.value = false;
  }
};

const handleDeletePolicy = async (id) => {
  deleteLoading.value = true;
  try {
    await apiRequest.delete(`/payer-institution-contract/${id}`);
    await fetchPolicies();
  } catch (error) {
    console.error("Failed to delete policy:", error);
  } finally {
    deleteLoading.value = false;
    policyToDelete.value = "";
  }
};

onMounted(() => {
  fetchPolicies();
});
</script>

<template>
  <DefaultPage 
    placeholder="Search Quoted Policies"
    title="Quoted Policies"
    :icon="icons.quoted_policy" 
  >
    <template #default="{ search }">
      <Table
        :pending="loading"
        :headers="{
          head: [
            'Policy Name',
            'Institution',
            'Quote Date',
            'Expiry Date',
            'Premium',
            'Status',
            'Actions'
          ],
          row: [
            'policyName',
            'institutionName',
            'quoteDate',
            'expiryDate',
            'premiumAmount',
            'status'
          ]
        }"
        :rows="policies"
        :rowCom="QuotedPolicyRow"
      >
        <template #row>
          <QuotedPolicyRow
            :rowData="policies"
            :rowKeys="['policyName', 'institutionName', 'quoteDate', 'expiryDate', 'premiumAmount', 'status']"
            :onDelete="(id) => policyToDelete = id"
          />
        </template>

        <template #empty>
          <div class="py-12 text-center">
            <div class="flex flex-col items-center justify-center">
              <i v-html="icons.document"></i>
              <p class="text-gray-500">No quoted policies found</p>
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
  <div v-if="policyToDelete" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-md w-full">
      <h3 class="text-lg font-medium mb-4">Confirm Deletion</h3>
      <p class="mb-6">Are you sure you want to delete this quoted policy?</p>
      <div class="flex justify-end space-x-3">
        <button 
          @click="policyToDelete = ''" 
          class="px-4 py-2 border border-gray-300 rounded-md"
        >
          Cancel
        </button>
        <button 
          @click="handleDeletePolicy(policyToDelete)" 
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