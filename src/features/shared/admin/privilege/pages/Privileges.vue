<script setup>
import { computed, ref } from "vue";
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import PrivilegesDataProvider from "../components/PrivilegesDataProvider.vue";
import PrivilegeRow from "../components/PrivilegeRow.vue";
import TableRowSkeleton from "@/components/TableRowSkeleton.vue";
import icons from "@/utils/icons";
import { useAuthStore } from "@/stores/auth";
import { isExactSuperAdmin } from "@/utils/roleAccess";
import { defaultListModule, moduleOptions } from "../../catalog";

const dataProvider = ref();
const isMobile = ref(false);
const search = ref("");
const authStore = useAuthStore();
const currentUser = computed(() => authStore.auth?.user ?? authStore.auth ?? {});
const modules = computed(() => moduleOptions(currentUser.value));
const moduleType = ref(defaultListModule(currentUser.value));
const category = ref("");
const sortBy = ref("privilegeName");
const sortDir = ref("asc");

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
  <DefaultPage v-model="search" placeholder="Search privileges by name, description, or category">
    <template #filter>
      <div class="flex flex-wrap gap-2">
        <select v-model="moduleType" aria-label="Filter privileges by module" class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong">
          <option v-if="isExactSuperAdmin(currentUser)" value="all">All modules</option>
          <option v-for="mod in modules" :key="mod.value" :value="mod.value">{{ mod.label }}</option>
        </select>
        <input
          v-model="category"
          type="search"
          placeholder="Category"
          aria-label="Filter by category"
          class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong w-36"
        />
        <select v-model="sortBy" aria-label="Sort privileges by" class="px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong">
          <option value="privilegeName">Name</option>
          <option value="privilegeCategory">Category</option>
          <option value="moduleType">Module</option>
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
        @click="$router.push('/add_privilege')"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Privilege</p>
      </button>
    </template>

    <template #default="{ search }">
      <PrivilegesDataProvider
        ref="dataProvider"
        :pre-page="1000"
        :search="search"
        :module-type="moduleType"
        :category="category"
        :sort-by="sortBy"
        :sort-dir="sortDir"
        v-slot="{ privileges, pending }"
      >
        <Table
          :pending="pending"
          :virtual="true"
          :itemKey="'privilegeUuid'"
          :virtualHeight="600"
          :virtualItemSize="64"
          :headers="{
            head: [ 'Privilege Name', 'Description', 'Category', 'Module', 'Actions'],
            row: ['index', 'privilegeName', 'privilegeDescription', 'privilegeCategory', 'moduleType'],
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
