<script setup>
import { ref } from "vue";
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import PrivilegesDataProvider from "../components/PrivilegesDataProvider.vue";
import icons from "@/utils/icons";
import Dropdown from "@/components/new_form_elements/Dropdown.vue";


const dataProvider = ref();


</script>

<template>
  <DefaultPage  placeholder="Search Privileges">
    <template #filter>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>

    <template #add-action>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
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
        v-slot="{ privileges, pending,  }"
      >
      
        <Table
          :pending="pending"
          :headers="{
            head: ['Privilege Name', 'Description', 'Category', 'Actions'],
            row: ['privilegeName', 'privilegeDescription', 'privilegeCategory'],
          }"
          :rows="privileges"
        
        >
         <template #actions="{row}">
          <Dropdown v-slot="{ setRef, toggleDropdown }">
        <div
          @click.prevent="toggleDropdown"
          class="flex items-center gap-2 px-5 py-3 rounded-lg cursor-pointer"
        >
          <button>
            <i v-html="icons.threeDots"></i>
          </button>
        </div>
        <div
          class="flex shadow-lg text-base p-2 mt-2 rounded-lg flex-col gap-2 bg-white"
          :ref="setRef"
        >
          <button @click.prevent="$router.push(`/edit_privilege/${row?.privilegeUuid}`)"
            class="p-2 flex text-base-clr items-center gap-2 rounded-lg hover:bg-gray-100"
          >
            <i v-html="icons.edits" />
            <span>Edit</span>
          </button>

          <button
          
            class="p-2 flex text-base-clr items-center gap-2 rounded-lg hover:bg-gray-100"
          >
            <i v-html="icons.details" />
            <span>Detal</span>
          </button>
          
        </div>
      </Dropdown>
      </template>
         
        </Table>
      </PrivilegesDataProvider>
    </template>
  </DefaultPage>
</template>
