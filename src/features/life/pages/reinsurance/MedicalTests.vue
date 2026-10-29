<script setup>
import { computed } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import { toasted } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { confirmAction } from "../../composables/confirmAction";
import { TreatyStatus } from "../../constants/statuses";
import { deleteFclMedicalParameter, getFclMedicalParameters, updateFclMedicalParameterStatus } from "../../api/reinsuranceApi";

const COLUMNS = [{ key: "label", label: "Code", class: "w-28" }, { key: "medicalTestDescription", label: "Test" }, { key: "status", label: "Status" }, { key: "actions", label: "Actions", align: "right", srOnly: true }];
const TABS = { Active: TreatyStatus.ACTIVE, Pending: TreatyStatus.PENDING, Revised: TreatyStatus.REVISED };
const list = useLifePagedList(getFclMedicalParameters, { status: TreatyStatus.ACTIVE });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });

const edit = (test) => openModal("LifeMedicalTestForm", { test }, (saved) => saved && list.reload());

function setStatus(t, status) {
  const verb = status === TreatyStatus.ACTIVE ? "Activate" : "Retire";
  confirmAction(
    { title: `${verb} ${t.label}?`, message: status === TreatyStatus.ACTIVE ? "It can then be required by medical underwriting ranges." : "It is kept for history but no longer offered for new ranges.", confirmText: verb },
    async () => {
      const res = await updateFclMedicalParameterStatus(t.fclMedicalParameterUuid, { status });
      if (res?.success) { toasted(true, `${t.label} updated`); list.reload(); }
    }
  );
}

function remove(t) {
  confirmAction({ title: `Delete ${t.label}?`, message: "Ranges that require this test lose the requirement. This can't be undone.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteFclMedicalParameter(t.fclMedicalParameterUuid);
    if (res?.success) { toasted(true, "Medical test deleted"); list.reload(); }
  });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Medical tests" subtitle="Evidence of health a reinsurer can ask for when a life is above the free cover limit — referenced by each treaty's medical underwriting ranges.">
      <template #actions><Button @click="edit()">Add test</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-64"><TextField v-model="list.search.value" type="search" placeholder="Search tests" aria-label="Search tests" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="list.rows.value"
      row-key="fclMedicalParameterUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load medical tests"
      :empty-title="list.search.value ? 'No tests match your search' : `No ${tab.toLowerCase()} medical tests`"
      @retry="list.reload()"
    >
      <template #cell-label="{ row }"><span class="px-2 py-1 font-mono text-xs font-semibold rounded-md bg-surface-raised text-ink">{{ row.label }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-actions="{ row }">
        <div class="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" @click="edit(row)">Edit</Button>
          <Button v-if="row.status !== 'ACTIVE'" variant="ghost" size="sm" @click="setStatus(row, 'ACTIVE')">Activate</Button>
          <Button v-else variant="ghost" size="sm" @click="setStatus(row, 'REVISED')">Retire</Button>
          <Button variant="ghost" size="sm" class="!text-error" @click="remove(row)">Delete</Button>
        </div>
      </template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
