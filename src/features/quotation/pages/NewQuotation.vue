<script setup lang="ts">
import Button from "@/components/Button.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import InstitutionsByStatusDataProvider from "@/features/institutions/components/InstitutionsByStatusDataProvider.vue";
</script>
<template>
  <DefaultPage v-slot="{ search }">
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
        <template #actions="{row}">
          <Button type="link" size="xs">
            <RouterLink :to="`new_quotation/generate/${row.institutionUuid}`">
              Generate Quotation
            </RouterLink>
          </Button>
        </template>
      </Table>
    </InstitutionsByStatusDataProvider>
  </DefaultPage>
</template>
