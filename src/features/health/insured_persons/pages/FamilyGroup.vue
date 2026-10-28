<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import FamilyDataProvider from "../components/FamilyDataProvider.vue";
// import FamilyRow from "../components/FamilyRow.vue";
import Table from "@/components/Table.vue";
import FamilyRow from "../components/familyRow.vue";
import { useRoute } from "vue-router";

const props = defineProps({
  search: String,
});

const dataProvider = ref();
const auth = useAuthStore();
const route = useRoute();
const institutionId = ref(route.params.id || route.params.payerInstitutionContractUuid || auth.auth?.user?.payerUuid || "");

function remove(allowedUuid) {
  console.log("Removing package:", allowedUuid);
}

const loadMore = () => {
  if (dataProvider.value) {
    dataProvider.value.loadMore();
  }
};

function handleRefetch() {
  if (dataProvider.value?.refresh) {
    dataProvider.value.refresh();
  }
}
</script>

<template>
  <FamilyDataProvider
    ref="dataProvider"
    :id="institutionId"
    :search="props.search"
    v-slot="{ group, pending, loadingMore, hasMore }"
  >
    <Table
      infinite-scroll
      @load-more="loadMore"
      :loading-more="loadingMore"
      :has-more="hasMore"
      :pending="pending"
      :headers="{
        head: [
          'Plan Type',
          'Benefits',
          'Sum Assured',
          'Number Of Insured',
          'Number Of Dependants',
         
          'Actions',
        ],
        row: [
          'planType',
          'packageName',
          'coverage',
          'numberOfInsured',
          'numberOfDependants',
         
        ],
      }"
      :rows="group"
      :rowCom="FamilyRow"
    >
      <template #row>
        <FamilyRow
          :rowData="group"
          :rowKeys="[
            'planType',
            'packageName',
            'coverage',
            'numberOfInsured',
            'numberOfDependants',
           
          ]"
          :headKeys="[
            'Plan Type',
            'Benefits',
            'Sum Assured',
            'Number Of Insured',
            'Number Of Dependants',
           
            'Actions',
          ]"
          :onRemove="remove"
          :onRefetch="handleRefetch"
        />
      </template>
    </Table>
  </FamilyDataProvider>
</template>
