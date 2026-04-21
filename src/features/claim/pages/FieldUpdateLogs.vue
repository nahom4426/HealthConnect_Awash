<script setup>
import { computed, ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import FieldUpdateLogsDataProvider from "../components/FieldUpdateLogsDataProvider.vue";

const dataProvider = ref();

const updateEntity = ref("");
const updateField = ref("");
const updateUser = ref("");
const fromDate = ref("");
const toDate = ref("");

function toApiDate(dateStr) {
  if (!dateStr) return "";
  return String(dateStr).replaceAll("-", "/");
}

const params = computed(() => ({
  updateEntity: updateEntity.value?.trim() || undefined,
  updateField: updateField.value?.trim() || undefined,
  updateUser: updateUser.value?.trim() || undefined,
  fromDate: toApiDate(fromDate.value) || undefined,
  toDate: toApiDate(toDate.value) || undefined,
}));

function handlePageChange(page) {
  if (dataProvider.value) dataProvider.value.setPage(page);
}

function handleLimitChange(limit) {
  if (dataProvider.value) dataProvider.value.setLimit(limit);
}
</script>

<template>
  <DefaultPage title="Field Update Logs" placeholder="Search logs...">
    <template #header>
      <div class="grid grid-cols-1 gap-2 w-full sm:grid-cols-2 lg:grid-cols-5">
        <input
          v-model="updateEntity"
          placeholder="Entity (e.g. BENEFIT)"
          class="px-3 py-2 w-full text-sm bg-white rounded-lg border border-gray-200"
        />
        <input
          v-model="updateField"
          placeholder="Field (e.g. USED)"
          class="px-3 py-2 w-full text-sm bg-white rounded-lg border border-gray-200"
        />
        <input
          v-model="updateUser"
          placeholder="User"
          class="px-3 py-2 w-full text-sm bg-white rounded-lg border border-gray-200"
        />
        <input
          v-model="fromDate"
          type="date"
          class="px-3 py-2 w-full text-sm bg-white rounded-lg border border-gray-200"
        />
        <input
          v-model="toDate"
          type="date"
          class="px-3 py-2 w-full text-sm bg-white rounded-lg border border-gray-200"
        />
      </div>
    </template>

    <template #default="{ search }">
      <FieldUpdateLogsDataProvider
        ref="dataProvider"
        :search="search"
        :params="params"
        :auto="true"
        v-slot="{ logs, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: [
              'Update Date',
              'User',
              'Entity',
              'Field',
              'From Value',
              'To Value',
              'Remark',
            ],
            row: [
              'updateDate',
              'updateUser',
              'updateEntity',
              'updateField',
              'fromValue',
              'toValue',
              'remark',
            ],
          }"
          :rows="logs"
          :pagination="{
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        />
      </FieldUpdateLogsDataProvider>
    </template>
  </DefaultPage>
</template>
