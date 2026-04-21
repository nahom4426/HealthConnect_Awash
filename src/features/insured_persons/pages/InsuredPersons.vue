<script setup>
import { ref } from "vue";
import Table from "@/components/Table.vue";
import InsuredPersonsDataProvider from "../components/InsuredPersonsDataProvider.vue";
import StatusRow from "../components/InsuredPersonStatusRow.vue";
import { useAuthStore } from "@/stores/auth";

const props = defineProps({
  search: String,
  pageContext: {
    type: String,
    default: 'insured', // 'insured', 'membership', 'amend'
  },
  showActionButtons: {
    type: Boolean,
    default: true,
  },
});



const dataProvider = ref();
const auth = useAuthStore();
const institutionId = ref(auth.auth?.user?.payerUuid || "");

const loadMore = () => {
  if (dataProvider.value) {
    dataProvider.value.loadMore();
  }
};
</script>

<template>
  <InsuredPersonsDataProvider
    ref="dataProvider"
    :institutionId="institutionId"
    :search="props.search"
    v-slot="{ insuredMembers, pending, currentPage, itemsPerPage, totalPages, loadingMore, hasMore }"
  >
    <Table
      infinite-scroll
      @load-more="loadMore"
      :loading-more="loadingMore"
      :has-more="hasMore"
      :pending="pending"
      :headers="{
        head: [
          'Full Name',
          'ID Number',
          'Phone',
          'Dependents',
          'Status',
          'Actions',
        ],
        row: ['fullName', 'idNumber', 'phone', 'dependents', 'status'],
      }"
      :rows="insuredMembers"
      :rowCom="StatusRow"
    >
      <template #row>
        <StatusRow
          :rowData="insuredMembers"
          :rowKeys="['fullName', 'idNumber', 'phone', 'dependents', 'status']"
          :headKeys="[
            '',
            'Full Name',
            'CIF Number',
            'Phone',
            'Dependents',
            'Status',
            'Actions',
          ]"
          :pageContext="props.pageContext"
          :showActionButtons="props.showActionButtons"
        />
      </template>
    </Table>
  </InsuredPersonsDataProvider>
</template>