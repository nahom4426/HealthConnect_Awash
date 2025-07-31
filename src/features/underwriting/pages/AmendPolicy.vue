<script setup lang="ts">
import Button from '@/components/Button.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import InstitutionByStatusDataProvider from '@/features/institutions/components/InstitutionPolicyByStatusDataProvider.vue';
import InstitutionsByStatusDataProvider from '@/features/institutions/components/InstitutionsByStatusDataProvider.vue';
import { Status } from '@/types/interface';
import { secondDateFormat } from '@/utils/utils';
import { ref } from 'vue';

const status = ref(Status.ACTIVE)
</script>
<template>
	<DefaultPage placeholder="Search Registered Institution">
		<template v-slot="{ search }" >
			<InstitutionsByStatusDataProvider :status="status" :search="search" v-slot="{ institutions, pending }">
				<Table
					:pending="pending"
					:headers="{
						head: ['Institution Name', 'Tin', 'Institution Insurance Number', 'Phone', 'Status', 'actions'],
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
							Edit
						</p>
					</template>
				</Table>
			</InstitutionsByStatusDataProvider>
		</template>
	</DefaultPage>
</template>