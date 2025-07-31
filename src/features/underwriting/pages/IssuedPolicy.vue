<script setup lang="ts">
import Button from '@/components/Button.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import InstitutionByStatusDataProvider from '@/features/institutions/components/InstitutionPolicyByStatusDataProvider.vue';
import { Status } from '@/types/interface';
import { secondDateFormat } from '@/utils/utils';
import { ref } from 'vue';

const status = ref<Status>(Status.ACTIVE)
</script>
<template>
	<DefaultPage placeholder="Search Registered Institution">
		<template #more>
			<div class="ml-auto">
				<select v-model="status" class="h-10 rounded px-4">
					<option value="ACTIVE" >Active</option>
					<option value="PENDING">Pending</option>
					<option value="HISTORY">History</option>
				</select>
			</div>
		</template>
		<template v-slot="{ search }" >
			<InstitutionByStatusDataProvider :status="status" :search="search" v-slot="{ institutions, pending }">
				<Table
					:pending="pending"
					:headers="{
						head: ['Institution Name', 'Tin', 'Institution Insurance Number', 'Phone', 'Status'],
						row: ['institutionName', 'tinNumber', 'institutionInsuranceNumber', 'telephone', 'status']
					}"
					:rows="institutions"
					:cells="{
						quotationAcceptedDate: (date: string) => {
							return secondDateFormat(date)
						},
						paidDate: (date: string) => {
							return secondDateFormat(date)
						}
					}"
				>
					<template #actions>
						<p size="xs" class='hover:text-primary font-medium underline italic'>
							New Quotation
						</p>
					</template>
				</Table>
			</InstitutionByStatusDataProvider>
		</template>
	</DefaultPage>
</template>