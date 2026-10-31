<script setup>
import { ref, computed } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import icons from "@/utils/icons";
import RolesDataProvider from "../components/RolesDataProvider.vue";
import RoleRow from "../components/RoleRow.vue";
import { removeRoleById } from "../Api/RoleApi";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { isExactSuperAdmin } from "@/utils/roleAccess";
import { defaultListModule, moduleOptions } from "../../catalog";

const router = useRouter();
const search = ref("");
const deleteReq = useApiRequest();
const authStore = useAuthStore();
const currentUser = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const modules = computed(() => moduleOptions(currentUser.value));
const moduleType = ref(defaultListModule(currentUser.value));
const sortBy = ref("roleName");
const sortDir = ref("asc");

function handleDelete(id) {
  const roleUuid = typeof id === "object" && id !== null ? id.roleUuid || id.id : id;
  if (!roleUuid) {
    toasted(false, "", "Invalid role id");
    return;
  }
  if (confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
    deleteReq.send(
      () => removeRoleById(roleUuid),
      (res) => {
        if (res.success) {
          toasted(true, "Role deleted successfully");
        } else {
          toasted(false, "", res.error || "Failed to delete role");
        }
      }
    );
  }
}

function handleEdit(row) {
  router.push(`/edit_role/${row.roleUuid}`);
}

function handleDetail(row) {
  router.push(`/role_detail/${row.roleUuid}`);
}
</script>

<template>
  <DefaultPage v-model="search" placeholder="Search roles by name or description">
    <template #filter>
      <div class="flex flex-wrap gap-2">
        <select v-model="moduleType" aria-label="Filter roles by module" class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong">
          <option v-if="isExactSuperAdmin(currentUser)" value="all">All modules</option>
          <option v-for="mod in modules" :key="mod.value" :value="mod.value">{{ mod.label }}</option>
        </select>
        <select v-model="sortBy" aria-label="Sort roles by" class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong">
          <option value="roleName">Name</option>
          <option value="moduleType">Module</option>
          <option value="id">Newest</option>
        </select>
        <select v-model="sortDir" aria-label="Sort direction" class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </template>

    <template #add-action>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
        @click.prevent="$router.push('/create-role')"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Role</p>
      </button>
    </template>

    <template #default="{ search }">
      <RolesDataProvider
        :search="search"
        :module-type="moduleType"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        v-slot="{ roles, pending }"
      >
        <Table
          :pending="pending"
          :virtual="true"
          :itemKey="'roleUuid'"
          :virtualHeight="600"
          :virtualItemSize="64"
          :showPagination="false"
          :rowCom="RoleRow"
          :headers="{
            head: ['Role Name', 'Description', 'Module', 'Privileges', 'Actions'],
            row: ['roleName', 'roleDescription', 'moduleType', 'rolePrivileges'],
          }"
          :rows="roles || []"
          placeholder="There are no roles to display at the moment."
          :cells="{
            onEdit: handleEdit,
            onDelete: handleDelete,
            onDetail: handleDetail,
          }"
        />
      </RolesDataProvider>
    </template>
  </DefaultPage>
</template>
