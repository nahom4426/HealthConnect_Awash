<script setup>
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
import GroupInsuredDataProvider from "../components/GroupComponents/GroupInsuredDataProvider.vue";
</script>

<template>
  <DefaultPage placeholder="Search Insured Members">
    <template #filter>
      <button
        @click="openModal('AddMembersToGroup', $route.params?.id)"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      >
        <p class="text-base">Add Members</p>
      </button>
    </template>

    <template #add-action>
      <button
        @click.prevent="openModal('AddServicesToGroup', $route.params?.id)"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Services And Drugs</p>
      </button>
    </template>
    <template #default="{ search }">
      <GroupInsuredDataProvider
        :id="$route.params.id"
        :search="search"
        v-slot="{ insured, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Full Name', 'ID Number', 'Phone', 'Position', 'Status'],
            row: ['fullName', 'idNumber', 'phone', 'position', 'status'],
          }"
          :rows="insured || []"
          :cells="{
            fullName: (_, row) => {
              return row?.firstName + ' ' + row?.fatherName;
            },
          }"
        >
        </Table>
      </GroupInsuredDataProvider>
    </template>
  </DefaultPage>
</template>
