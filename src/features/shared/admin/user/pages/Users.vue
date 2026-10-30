<script setup>
import { computed, ref } from "vue";
import Table from "@/components/Table.vue";
import TableRowSkeleton from "@/components/TableRowSkeleton.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import icons from "@/utils/icons";
import UserStatusRow from "../components/statusrow.vue";
import UsersDataProvider from "../components/UsersDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import { useRouter } from "vue-router";
import { getAllBranches } from "../../branch/Api/BranchApi";
import { useAuthStore } from "@/stores/auth";
import { isExactSuperAdmin } from "@/utils/roleAccess";
import { defaultListModule, moduleOptions } from "../../catalog";

const router = useRouter();
const search = ref("");
const authStore = useAuthStore();
const currentUser = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const modules = computed(() => moduleOptions(currentUser.value));
const moduleType = ref(defaultListModule(currentUser.value));
const canFilterBranches = computed(() => {
  const privileges = Array.isArray(currentUser.value?.privileges) ? currentUser.value.privileges : [];
  return (
    isExactSuperAdmin(currentUser.value) ||
    privileges.includes("All Privileges") ||
    privileges.includes("ROLE_branch.manage")
  );
});
const status = ref("");
const sortBy = ref("firstName");
const sortDir = ref("asc");

// Branch filter -> ?branchUuid= on GET /users/all
const branchUuid = ref("");
const branches = ref([]);
if (canFilterBranches.value) {
  getAllBranches(true).then((res) => {
    if (res?.success) {
      branches.value = Array.isArray(res.data) ? res.data : res.data?.content || [];
    }
  });
}
</script>

<template>
  <DefaultPage v-model="search" placeholder="Search Users">
    <template #filter>
      <div class="flex flex-wrap gap-2">
        <select
          v-model="moduleType"
          aria-label="Filter by module"
          class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option v-if="isExactSuperAdmin(currentUser)" value="all">All modules</option>
          <option v-for="mod in modules" :key="mod.value" :value="mod.value">{{ mod.label }}</option>
        </select>
        <select
          v-if="canFilterBranches"
          v-model="branchUuid"
          aria-label="Filter by branch"
          class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">All branches</option>
          <option v-for="b in branches" :key="b.branchUuid" :value="b.branchUuid">
            {{ b.name }}{{ b.status && b.status !== 'ACTIVE' ? ' (inactive)' : '' }}
          </option>
        </select>
        <select
          v-model="status"
          aria-label="Filter by status"
          class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <select v-model="sortBy" aria-label="Sort users by" class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong">
          <option value="firstName">Name</option>
          <option value="email">Email</option>
          <option value="mobilePhone">Phone</option>
          <option value="userStatus">Status</option>
        </select>
        <select v-model="sortDir" aria-label="Sort direction" class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </template>

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
      <UsersDataProvider
        :search="search"
        :branchUuid="branchUuid"
        :moduleType="moduleType"
        :status="status"
        :sortBy="sortBy"
        :sortDir="sortDir"
        v-slot="{ users, pending, refresh }"
      >
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
              'Branch',
              'Modules',
              'Gender',
              'Status',
             
              'Actions',
            ],
            row: [
              'index',
              'fullname',
              'email',
              'mobilePhone',
              'branches',
              'memberships',
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
