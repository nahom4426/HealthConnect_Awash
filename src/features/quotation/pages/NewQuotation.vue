<script setup lang="ts">
import Button from "@/components/Button.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import InstitutionsByStatusDataProvider from "@/features/institutions/components/InstitutionsByStatusDataProvider.vue";
import icons from "@/utils/icons";
const generateQuotationPath = (r: any) => `/new_quotation/generate/${r?.institutionUuid}`;
</script>
<template>
  <DefaultPage> 
    <template #add-action>
      <RouterLink
        :to="{ path: '/institutions/add', query: { from: 'new_quotation' } }"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
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
        <template #actions="slot">
          <Button type="link" size="xs">
            <RouterLink :to="generateQuotationPath(((slot as unknown) as { row: any }).row)">
              Generate Quotation
            </RouterLink>
          </Button>
        </template>
      </Table>
      </InstitutionsByStatusDataProvider>
    </template>
  </DefaultPage>
</template>
