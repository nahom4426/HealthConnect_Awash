<script setup lang="ts">
import Button from '@/components/Button.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import ProviderDataProvider from '../components/ProviderDataProvider.vue';
import { openModal } from '@customizer/modal-x';

import { Status } from '@/types/interface';
import { secondDateFormat } from '@/utils/utils';
import { ref } from 'vue';

const status = ref(Status.ACTIVE)

function addProvider() {
    openModal('AddProviderForm')
}
</script>
<template>
	<DefaultPage placeholder="Search ">
		<template #more>
			<Button @click="addProvider" type="primary" class="ml-4">
				Add Provider
			</Button>
		</template>
		<template v-slot="{ search }" >
			<ProviderDataProvider :search="search" v-slot="{ providers, pending }">
				<Table
					:pending="pending"
					:headers="{
						head: ['Provider Name', 'Email', 'Category', 'Level', 'Phone', 'Status', 'actions'],
						row: ['providerName', 'email', 'category', 'level', 'telephone', 'status']
					}"
					:rows="providers"
				>
					<template #actions="{ row }">
						<p size="xs" class='hover:text-primary font-medium underline italic'>
							Edit
						</p>
					</template>
				</Table>
			</ProviderDataProvider>
		</template>
	</DefaultPage>
</template>






