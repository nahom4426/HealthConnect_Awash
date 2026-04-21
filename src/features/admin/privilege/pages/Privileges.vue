<script setup>
import { ref } from "vue";
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import PrivilegesDataProvider from "../components/PrivilegesDataProvider.vue";
import PrivilegeRow from "../components/PrivilegeRow.vue";
import TableRowSkeleton from "@/components/TableRowSkeleton.vue";
import icons from "@/utils/icons";

const dataProvider = ref();
const isMobile = ref(false);

// Check if mobile on mount and resize
function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

if (typeof window !== 'undefined') {
  checkMobile();
  window.addEventListener('resize', checkMobile);
}

</script>

<template>
  <DefaultPage  placeholder="Search Privileges">
     <!-- <template #filter>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 bg-gray-100 rounded-md text-primary"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>
  -->
    <template #add-action>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
        @click="$router.push('/add_privilege')"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Privilege</p>
      </button>
    </template>

    <template #default="{ search }">
      <PrivilegesDataProvider
        ref="dataProvider"
        :search="search"
        v-slot="{ privileges, pending }"
      >
        <Table
          :pending="pending"
          :virtual="true"
          :itemKey="'privilegeUuid'"
          :virtualHeight="600"
          :virtualItemSize="64"
          :headers="{
            head: [ 'Privilege Name', 'Description', 'Category', 'Actions'],
            row: ['index', 'privilegeName', 'privilegeDescription', 'privilegeCategory'],
          }"
          :rows="privileges"
          :rowCom="PrivilegeRow"
          :Fallback="TableRowSkeleton"
          :isMobile="isMobile"
        />
      </PrivilegesDataProvider>
    </template>
  </DefaultPage>
</template>
