<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import { usePagination } from "@/composables/usePagination.JS";
import { getInstitutionsById } from "@/features/institutions/api/institutionApi";
import { allRequest, secondDateFormat } from "@/utils/utils";
import { useRoute } from "vue-router";
import { Status, type Pagination } from "@/types/interface";
import { getInstitutionPolicyByStatus } from "@/features/institutions/api/payerInstitutionContractApi";
import Table from "@/components/Table.vue";
import type { InstitutionContract } from "@/features/institutions/store/payerInstitutionContractStore";
import Button from "@/components/Button.vue";
import icons from "@/utils/icons";
import type { PropType } from "vue";
import type { Institution } from "@/features/institutions/store/institutionsStore";

const props = defineProps({
  instituton: {
    type: Object as PropType<Institution>,
    required: true,
  },
});

const route = useRoute();
const institutionUuid = route.params.institutionUuid;

const pagination = usePagination({
  cb: () =>
    getInstitutionPolicyByStatus(institutionUuid as string, {
      status: Status.PENDING,
    }),
});
</script>
<template>
  <DefaultPage>
    <template #more>
      <div class="flex-1 flex justify-end">
        <Button type="primary" class="gap-3 items-center">
          <i class="grid place-items-center pb-1" v-html="icons.plus" />
          Add Category
        </Button>
      </div>
    </template>
    <template #header>
			<div class="flex items-baseline gap-2">
				Contract detail for
				<p class="underline text-lg font-bold">
					{{ instituton.institutionName }}
				</p>
			</div>
		</template>
    <Table
      :pending="pagination.pending.value"
      :headers="{
        head: [
          'Policy Number',
          'Description',
          'Effective Date',
          'Status',
          'actions',
        ],
        row: ['contractCode', 'contractName', 'effectiveDate', 'status'],
      }"
      :rows="pagination.data.value"
      :cells="{
				effectiveDate: (_: any, row: InstitutionContract) => {
					return `${secondDateFormat(row.beginDate)} - ${secondDateFormat(row.endDate)}`
				}
			}"
    >
      <template #actions="{ row }: {row: any}">
        <div class="flex items-center gap-2">
          <RouterLink
            v-ripple
            :to="`/add_new_policy/detail/${row?.institutionUuid}/institution_coveraage/${row?.payerInstitutionContractUuid}`"
            class="size-8 bg-gray-200 rounded-full shadow-lg grid place-items-center"
          >
            <i v-html="icons.coverage" />
          </RouterLink>
          <RouterLink
            v-ripple
            :to="`/add_new_policy/detail/${row?.institutionUuid}/insured_persons/${row?.payerInstitutionContractUuid}`"
            class="size-8 bg-gray-200 rounded-full shadow-lg grid place-items-center"
          >
            <i v-html="icons.insured" />
          </RouterLink>
          <RouterLink
            v-ripple
            to=""
            class="size-8 bg-gray-200 rounded-full shadow-lg grid place-items-center"
          >
            <i v-html="icons.provider" />
          </RouterLink>
        </div>
      </template>
    </Table>
  </DefaultPage>
</template>
