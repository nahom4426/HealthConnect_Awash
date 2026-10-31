<script setup>
import { computed, ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import icons from "@/utils/icons";
import { openModal } from "@customizer/modal-x";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import BranchRow from "../components/BranchRow.vue";
import { getAllBranches, changeBranchStatus } from "../Api/BranchApi";

const branches = ref([]);
const showInactive = ref(true);
const listReq = useApiRequest();
const statusReq = useApiRequest();

function load() {
  listReq.send(
    () => getAllBranches(showInactive.value),
    (res) => {
      if (res.success) {
        branches.value = Array.isArray(res.data) ? res.data : res.data?.content || [];
      } else {
        toasted(false, "", res.error || "Failed to load branches");
      }
    }
  );
}
load();

function filtered(search) {
  const q = String(search || "").trim().toLowerCase();
  if (!q) return branches.value;
  return branches.value.filter((b) =>
    [b.code, b.name, b.region, b.address, b.phone].some((v) => String(v || "").toLowerCase().includes(q))
  );
}

function upsert(branch) {
  if (!branch?.branchUuid) return load();
  const idx = branches.value.findIndex((b) => b.branchUuid === branch.branchUuid);
  if (idx === -1) branches.value.push(branch);
  else branches.value.splice(idx, 1, branch);
}

function openCreate() {
  openModal("BranchForm", { onSaved: upsert });
}

function handleEdit(row) {
  openModal("BranchForm", { branch: row, onSaved: upsert });
}

function setStatus(row, status) {
  statusReq.send(
    () => changeBranchStatus(row.branchUuid, status),
    (res) => {
      toasted(res.success, status === "ACTIVE" ? "Branch activated" : "Branch deactivated", res.error);
      if (res.success) {
        if (!showInactive.value && status === "INACTIVE") {
          branches.value = branches.value.filter((b) => b.branchUuid !== row.branchUuid);
        } else {
          upsert(res.data?.branchUuid ? res.data : { ...row, status });
        }
      }
    }
  );
}

function handleDeactivate(row) {
  openModal(
    "Confirmation",
    {
      title: "Deactivate branch",
      message: `Deactivate ${row.name}? It can no longer be assigned to users or records until reactivated.`,
      confirmText: "Deactivate",
      cancelText: "Cancel",
      tone: "danger",
    },
    (yes) => yes && setStatus(row, "INACTIVE")
  );
}

const cells = computed(() => ({
  onEdit: handleEdit,
  onActivate: (row) => setStatus(row, "ACTIVE"),
  onDeactivate: handleDeactivate,
}));
</script>

<template>
  <DefaultPage placeholder="Search Branches">
    <template #filter>
      <label class="flex gap-2 items-center text-sm text-ink-muted">
        <input type="checkbox" v-model="showInactive" @change="load" class="rounded border-line-strong" />
        Show inactive
      </label>
    </template>

    <template #add-action>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 font-medium text-white rounded-lg transition-colors bg-primary hover:bg-primary/90"
        @click.prevent="openCreate"
      >
        <i v-html="icons.plus_circle" class="flex justify-center items-center w-5 h-5"></i>
        <span class="leading-none">Add Branch</span>
      </button>
    </template>

    <template #default="{ search }">
      <Table
        :pending="listReq.pending.value"
        :showPagination="false"
        :rowCom="BranchRow"
        :headers="{
          head: ['Code', 'Name', 'Region', 'Address', 'Phone', 'Status', 'Actions'],
          row: ['code', 'name', 'region', 'address', 'phone', 'status'],
        }"
        :rows="filtered(search)"
        :cells="cells"
        placeholder="There are no branches to display."
      />
    </template>
  </DefaultPage>
</template>
