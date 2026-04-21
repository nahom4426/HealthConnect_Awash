<script setup lang="ts">
import Button from "@/components/Button.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import InstitutionsByStatusDataProvider from "@/features/institutions/components/InstitutionsByStatusDataProvider.vue";
import NewQuotationInstitutionRow from "@/features/quotation/components/NewQuotationInstitutionRow.vue";
import icons from "@/utils/icons";
const generateQuotationPath = (r: any) => `/new_quotation/generate/${r?.institutionUuid}`;
</script>
<template>
  <DefaultPage> 
    <template #add-action>
      <RouterLink
        :to="{ path: '/institutions/add', query: { from: 'new_quotation' } }"
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
      >
        <i v-html="icons.plus"></i>
        <p class="text-base">Add Institution</p>
      </RouterLink>
    </template>
    
    <template #default="{ search }">
      <InstitutionsByStatusDataProvider
        :search="search"
        v-slot="{ institutions, pending }"
      >
      <Table
        :pending="pending"
        :rowCom="NewQuotationInstitutionRow"
        :headers="{
          head: [
            'Institution Name',
            'Address',
            'Telephone',
            'Status',
            'actions',
          ],
          row: ['institutionName', 'address', 'telephone', 'status'],
        }"
        :cells="{
					address: (_: any, row: any) => `woreda ${row.address1}, ${row.address2}, ${row.address3}` 
				}"
        :rows="institutions"
      >
      </Table>
      </InstitutionsByStatusDataProvider>
    </template>
  </DefaultPage>
</template>
