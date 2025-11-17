<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import FamilyDataProvider from "../components/FamilyDataProvider.vue";
// import FamilyRow from "../components/FamilyRow.vue";
import Table from "@/components/Table.vue";
import FamilyRow from "../components/familyRow.vue";

const props = defineProps({
  search: String,
});

const dataProvider = ref();
const auth = useAuthStore();
const institutionId = ref(auth.auth?.user?.payerUuid || "");

function remove(allowedUuid) {
  console.log("Removing package:", allowedUuid);
}

const loadMore = () => {
  if (dataProvider.value) {
    dataProvider.value.loadMore();
  }
};
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
          'Number of Packages',
          'Max Benefit (Employee)',
          'Max Allowed Dependant Age',
          'Max Allowed Dependants',
          'Max Benefit (Children)',
          'Max Benefit (Spouse)',
          'Actions',
        ],
        row: [
          'planType',
          'packages',
          'maxBenefitForEmployee',
          'maxAllowedDependantAge',
          'maxAllowedDependants',
          'maxBenefitForChildren',
          'maxBenefitForSpouse',
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
            'packages',
            'maxBenefitForEmployee',
            'maxAllowedDependantAge',
            'maxAllowedDependants',
            'maxBenefitForChildren',
            'maxBenefitForSpouse',
          ]"
          :headKeys="[
            'Plan Type',
            'Number of Packages',
            'Max Benefit (Employee)',
            'Max Allowed Dependant Age',
            'Max Allowed Dependants',
            'Max Benefit (Children)',
            'Max Benefit (Spouse)',
            'Actions',
          ]"
          :onRemove="remove"
        />
      </template>
    </Table>
  </FamilyDataProvider>
</template>
