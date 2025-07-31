<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import { usePagination } from "@/composables/usePagination";
import { getInstitutionsById } from "@/features/institutions/api/institutionsApi";
import { allRequest, secondDateFormat } from "@/utils/utils";
import { useRoute } from "vue-router";
import  { Status, type Pagination } from "@/types/interface";
import Table from "@/components/Table.vue";
import type { InstitutionContract } from "@/features/institutions/store/payerInstitutionContractStore";
import Button from "@/components/Button.vue";
import icons from "@/utils/icons";
import { institutionCoverage } from "@/features/insured_service/insuredServiceApi";
import type { Institution } from "@/features/institutions/store/institutionsStore";
import type { PropType } from "vue";

const props = defineProps({
  instituton: {
    type: Object as PropType<Institution>,
    required: true,
  },
});

const route = useRoute();
const payerInstitutionContractUuid = route.params.payerInstitutionContractUuid;

const pagination = usePagination({
  cb: () => institutionCoverage(payerInstitutionContractUuid as string)
});
</script>
<template>
  <DefaultPage>
		<template #more>
			<div class="flex-1 flex items-center gap-1 justify-end">
				<Button type="primary" class="gap-3 items-center">
					<i class="grid place-items-center pb-1" v-html="icons.plus" />
					Add Coverage
				</Button>
			</div>	
		</template>
		<template #header>
			<div class='flex items-baseline gap-2'>
				Coverage Types for institution <p class="underline text-lg font-bold">{{ instituton.institutionName }}</p>
			</div>
		</template>
		<Table
			:pending="pagination.pending.value"
			:headers="{
				head: ['Service Group', 'Description', 'Family Benefit', 'Employee Benefit', 'Spouse Benefit', 'Children Benefit', 'actions'],
				row: ['item', 'description', 'familyPoolBenefit', 'maxBenefitForEmployee', 'maxBenefitForSpouse', 'maxBenefitForChildren']
			}"
			:rows="pagination.data.value"
			:cells="{
				effectiveDate: (_: any, row: InstitutionContract) => {
					return `${secondDateFormat(row.beginDate)} - ${secondDateFormat(row.endDate)}`
				}
			}"
		>
			<template #actions>
				<div class="flex items-center gap-2">
					<p class="table_action">
						More
					</p>
				</div>
			</template>
		</Table>
	</DefaultPage>
</template>
