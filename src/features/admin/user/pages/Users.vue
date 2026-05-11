<script setup>
import { ref } from "vue";
import Table from "@/components/Table.vue";
import TableRowSkeleton from "@/components/TableRowSkeleton.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";
import UserStatusRow from "../components/statusrow.vue";
import UsersDataProvider from "../components/UsersDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import { useRouter } from "vue-router";


const router = useRouter();
</script>

<template>
  <DefaultPage v-model="search" placeholder="Search Users">
    <template #add-action>
     <button
  class="flex gap-2 justify-center items-center px-6 py-4 font-medium text-white rounded-lg transition-colors sm:px-4 sm:py-3 lg:px-6 lg:py-4 bg-primary sm:text-base hover:bg-primary/90 sm:w-auto"
  @click.prevent="openModal('AddUser')"
>
  <i
    v-html="icons.plus_circle"
    class="flex justify-center items-center w-5 h-5 sm:w-5 sm:h-5"
  ></i>
  <span class="leading-none">Add User</span>
</button>

    </template>

    <template #default="{ search }">
      <UsersDataProvider :search="search" v-slot="{ users, pending, refresh }">
        <Table
          :pending="pending"
          :virtual="true"
          :itemKey="'userUuid'"
          :virtualHeight="600"
          :virtualItemSize="64"
          :headers="{
            head: [
      
              'Full Name',
              'Email',
              'Mobile Phone',
              'Gender',
              'Status',
             
              'Actions',
            ],
            row: [
              'index',
              'fullname',
              'email',
              'mobilePhone',
              'gender',
              'userStatus',
             
            ],
          }"
          :rows="users"
          :rowCom="UserStatusRow"
          :Fallback="TableRowSkeleton"
        />
      </UsersDataProvider>
    </template>
  </DefaultPage>
</template>
