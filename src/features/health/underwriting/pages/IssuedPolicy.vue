<script setup>
import { ref } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import InstitutionByStatusDataProvider from '@/features/institutions/components/InstitutionPolicyByStatusDataProvider.vue';
import { secondDateFormat } from '@/utils/utils';
import { openModal } from '@customizer/modal-x';

// Use string directly instead of enum
const status = ref('ACTIVE');

function openCreatePolicyModal(institution) {
  openModal('CreateInstitutionContract', {
    institutionUuid: institution?.institutionUuid,
    institutionName: institution?.institutionName,
  });
}
</script>

<template>
  <DefaultPage placeholder="Search Registered Institution">
    <template #more>
      <div class="ml-auto">
        <select v-model="status" class="px-4 h-10 rounded">
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="HISTORY">History</option>
        </select>
      </div>
    </template>

    <template v-slot="{ search }">
      <InstitutionByStatusDataProvider
        :status="status"
        :search="search"
        v-slot="{ institutions, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Institution Name', 'Tin', 'Institution Insurance Number', 'Phone', 'Status', 'Actions'],
            row: ['institutionName', 'tinNumber', 'institutionInsuranceNumber', 'telephone', 'status']
          }"
          :rows="institutions"
          :cells="{
            quotationAcceptedDate: (date) => {
              return secondDateFormat(date);
            },
            paidDate: (date) => {
              return secondDateFormat(date);
            }
          }"
        >
          <template #actions="{ row }">
            <button
              type="button"
              class="italic font-medium underline hover:text-primary"
              @click.stop="openCreatePolicyModal(row)"
            >
              Add New Policy
            </button>
          </template>
        </Table>
      </InstitutionByStatusDataProvider>
    </template>
  </DefaultPage>
</template>
