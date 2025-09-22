<script setup>
import { ref } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import InstitutionByStatusDataProvider from '@/features/institutions/components/InstitutionPolicyByStatusDataProvider.vue';
import { secondDateFormat } from '@/utils/utils';

// Use string directly instead of enum
const status = ref('ACTIVE');
</script>

<template>
  <DefaultPage placeholder="Search Registered Institution">
    <template #more>
      <div class="ml-auto">
        <select v-model="status" class="h-10 rounded px-4">
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
            head: ['Institution Name', 'Tin', 'Institution Insurance Number', 'Phone', 'Status'],
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
          <template #actions>
            <p size="xs" class="hover:text-primary font-medium underline italic">
              New Quotation
            </p>
          </template>
        </Table>
      </InstitutionByStatusDataProvider>
    </template>
  </DefaultPage>
</template>
