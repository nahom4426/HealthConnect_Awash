<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import { usePagination } from "@/composables/usePagination.JS";
import { allRequest, secondDateFormat } from "@/utils/utils";
import { useRoute } from "vue-router";
import  { Status, type InsuredPerson, type Pagination } from "@/types/interface";
import Table from "@/components/Table.vue";
import type { InstitutionContract } from "@/features/institutions/store/payerInstitutionContractStore";
import Button from "@/components/Button.vue";
import icons from "@/utils/icons";
import { institutionCoverage } from "@/features/insured_service/insuredServiceApi";
import type { Institution } from "@/features/institutions/store/institutionsStore";
import type { PropType } from "vue";
import { getInsuredByContractId } from "@/features/insured_persons/api/insuredPersonsApi";
import { openModal } from '@customizer/modal-x'

const props = defineProps({
  instituton: {
    type: Object as PropType<Institution>,
    required: true,
  },
});

const route = useRoute();
const payerInstitutionContractUuid = route.params.payerInstitutionContractUuid;
const institutionUuid = route.params.institutionUuid;
const pagination = usePagination({
  cb: (data: any) => getInsuredByContractId(payerInstitutionContractUuid as string, data)
});

</script>
<template>
  <DefaultPage v-model="pagination.search.value">
		<template #more>
			<div class="flex-1 flex items-center gap-4 justify-end">
				<Button @click="openModal('AddMemberForm')" type="primary" class="gap-3 items-center">
					<i class="grid place-items-center pb-1" v-html="icons.plus" />
					Add Member
				</Button>
				<Button class="text-primary border border-primary gap-3 items-center">
					<i class="grid place-items-center pb-1" v-html="icons.import" />
					Import Members
				</Button>
			</div>	
		</template>
		<div class='flex items-baseline border p-2 gap-2'>
			Policy Holders For Institution <p class="underline text-lg font-bold">{{ instituton.institutionName }}</p>
		</div>
		<Table
			:pending="pagination.pending.value"
			:headers="{
				head: ['Fulname', 'Gender', 'Phone', 'Policy Holder No.', 'Address', 'Effective Date', 'status', 'actions'],
				row: ['fullname', 'gender', 'phone', 'insuranceId', 'address', 'effectiveDate', 'status']
			}"
			:rows="pagination.data.value"
			:cells="{
				fullname: (_: any, row: InsuredPerson) => {
					return `${row.title} ${row.firstName} ${row.fatherName} ${row.grandFatherName}`
				},
				effectiveDate: (_: any, row: InsuredPerson) => {
					return `${secondDateFormat(row.beginDate)} - ${secondDateFormat(row.endDate)}`
				},
				address: (_: any, row: InsuredPerson) => {
					return `${ row.state }, ${ row.country }`
				}
			}"
		>
			<template #actions="{ row }">
				<div class="flex items-center gap-2">
					<div v-ripple class="size-8 bg-gray-200 rounded-full shadow-lg grid place-items-center">
						<i v-html="icons.edit"/>
					</div>
					<div v-ripple class="size-8 bg-gray-200 rounded-full shadow-lg grid place-items-center">
						<i v-html="icons.group"/>
					</div>
				</div>
			</template>
		</Table>
	</DefaultPage>
</template>
