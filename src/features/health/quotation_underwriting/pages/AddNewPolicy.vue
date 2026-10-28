<script setup lang="ts">
import Button from '@/components/Button.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import InstitutionsDataProvider from '@/features/institutions/components/InstitutionContractStatusDataProvider.vue';
import { secondDateFormat } from '@/utils/utils';
import { openModal } from '@customizer/modal-x'
</script>
<template>
	<DefaultPage v-slot="{ search }" placeholder="Search Registered Institution">
		<InstitutionsDataProvider :search="search" v-slot="{ institutions, pending }">
			<div v-if="!pending && (!institutions || !institutions.length)" class="p-3 text-sm bg-yellow-50 border border-yellow-200 rounded mb-2">
				No institutions found.
			</div>
			<Table
				:pending="pending"
				:headers="{
					head: ['Institution Name', 'Quotation Number', 'Quoted Date', 'Paid Date', 'Payment Status', 'actions'],
					row: ['institutionName', 'quotationCode', 'quotationAcceptedDate', 'paidDate', 'status']
				}"
				:rows="institutions || []"
				:cells="{
					quotationAcceptedDate: (date: string) => {
						return secondDateFormat(date)
					},
					paidDate: (date: string) => {
						return secondDateFormat(date)
					}
				}"
			>
				<template #actions="{ row }">
					<div class="flex items-center gap-2">
						<RouterLink :to="`/add_new_policy/detail/${row.institutionUuid}`" size="xs" class='table_action'>
							View
						</RouterLink>
						<p size="xs" class='hover:text-primary font-medium underline italic'>
							Issue Policy
						</p>
					</div>
				</template>
			</Table>
		</InstitutionsDataProvider>
	</DefaultPage>
</template>