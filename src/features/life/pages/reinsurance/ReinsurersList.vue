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
import { RecordStatus } from "../../constants/statuses";
import { deleteReinsurer, getReinsurers, updateReinsurerStatus } from "../../api/reinsuranceApi";

const COLUMNS = [{ key: "name", label: "Reinsurer" }, { key: "contact", label: "Contact" }, { key: "location", label: "Location" }, { key: "status", label: "Status" }, { key: "actions", label: "Actions", align: "right", srOnly: true }];
const TABS = { Active: RecordStatus.ACTIVE, Pending: RecordStatus.PENDING, Disabled: RecordStatus.DISABLED };
const list = useLifePagedList(getReinsurers, { status: RecordStatus.ACTIVE });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });

const edit = (reinsurer) => openModal("LifeReinsurerForm", { reinsurer }, (saved) => saved && list.reload());

function setStatus(r, status) {
  const verb = status === RecordStatus.ACTIVE ? "Activate" : "Disable";
  confirmAction(
    { title: `${verb} ${r.name}?`, message: status === RecordStatus.ACTIVE ? "It can then be added to treaties." : "It can no longer be added to new treaties; existing treaties keep it.", confirmText: verb, tone: status === RecordStatus.DISABLED ? "danger" : "primary" },
    async () => {
      const res = await updateReinsurerStatus(r.reinsurerUuid, { status });
      if (res?.success) { toasted(true, `${r.name} ${status === RecordStatus.ACTIVE ? "activated" : "disabled"}`); list.reload(); }
    }
  );
}

function remove(r) {
  confirmAction({ title: `Delete ${r.name}?`, message: "The reinsurer is removed. This can't be undone.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteReinsurer(r.reinsurerUuid);
    if (res?.success) { toasted(true, "Reinsurer deleted"); list.reload(); }
  });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Reinsurers" subtitle="Companies that take part in Standard's life reinsurance treaties.">
      <template #actions><Button @click="edit()">Add reinsurer</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-64"><TextField v-model="list.search.value" type="search" placeholder="Search reinsurers" aria-label="Search reinsurers" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="list.rows.value"
      row-key="reinsurerUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load reinsurers"
      :empty-title="list.search.value ? 'No reinsurers match your search' : `No ${tab.toLowerCase()} reinsurers`"
      @retry="list.reload()"
    >
      <template #cell-name="{ row }"><span class="font-semibold text-ink">{{ row.name }}</span></template>
      <template #cell-contact="{ row }">
        <div class="text-ink-muted">
          <p>{{ row.phone || "—" }}</p>
          <p v-if="row.email" class="text-xs">{{ row.email }}</p>
        </div>
      </template>
      <template #cell-location="{ row }"><span class="text-ink-muted">{{ [row.state, row.country].filter(Boolean).join(", ") || "—" }}</span></template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-actions="{ row }">
        <div class="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" @click="edit(row)">Edit</Button>
          <Button v-if="row.status !== 'ACTIVE'" variant="ghost" size="sm" @click="setStatus(row, 'ACTIVE')">Activate</Button>
          <Button v-else variant="ghost" size="sm" @click="setStatus(row, 'DISABLED')">Disable</Button>
          <Button variant="ghost" size="sm" class="!text-error" @click="remove(row)">Delete</Button>
        </div>
      </template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
