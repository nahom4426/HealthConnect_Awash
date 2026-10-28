<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import DefaultPage from "@/components/DefaultPage.vue";
import CategoryDataProvider from "../components/CategoryDataProvider.vue";
import CategoryRow from "../components/CategoryRow.vue";

const route = useRoute();
const dataProvider = ref();

function refresh() {
  dataProvider.value?.refresh?.();
}

const contractUuid = route.params.contractUuid;
const policyUuid = route.params.id;

onMounted(() => {
  refresh();
});
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-white rounded-lg">
    <DefaultPage placeholder="Search Service Categories">
      <template #default="{ search }">
        <CategoryDataProvider
          ref="dataProvider"
          :auto="false"
          :search="search"
          v-slot="{ 
            categories, 
            loading, 
            error, 
            notEligibleByCategory,
            contractUuid: providerContractUuid,
            policyUuid: providerPolicyUuid,
            refresh: refreshData
          }"
        >
          <div v-if="error" class="p-2 text-error">{{ error }}</div>
          <div v-if="categories.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-surface-muted border-b">
                <tr>
                  <th class="p-4 text-left text-sm font-semibold text-ink-muted">#</th>
                  <th class="p-4 text-left text-sm font-semibold text-ink-muted">Category Name</th>
                  <th class="p-4 text-left text-sm font-semibold text-ink-muted">Status</th>
                  <th class="p-4 text-left text-sm font-semibold text-ink-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                <CategoryRow
                  :row-data="categories"
                  :row-keys="['categoryName', 'status']"
                  :head-keys="['Category Name', 'Status', 'Actions']"
                  :not-eligible-by-category="notEligibleByCategory"
                  :contract-uuid="providerContractUuid"
                  :policy-uuid="providerPolicyUuid"
                  :on-refresh="refreshData"
                />
              </tbody>
            </table>
          </div>
          <div v-else-if="!loading" class="p-8 text-center text-ink-subtle">
            No categories found
          </div>
          <div v-else class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CategoryDataProvider>
      </template>
    </DefaultPage>
  </div>
</template>
