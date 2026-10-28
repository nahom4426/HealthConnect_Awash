<script setup>
import { computed } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { toasted } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { confirmAction } from "../../composables/confirmAction";
import { RecordStatus } from "../../constants/statuses";
import { deleteReinsurer, getReinsurers, updateReinsurerStatus } from "../../api/reinsuranceApi";

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
    <LifePageHeader title="Reinsurers" subtitle="Companies that take part in Standard's life reinsurance treaties.">
      <template #actions><Button @click="edit()">Add reinsurer</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input v-model="list.search.value" type="search" placeholder="Search reinsurers" aria-label="Search reinsurers" class="px-3 w-64 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load reinsurers</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.reload()">Try again</Button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th class="px-4 py-3">Reinsurer</th>
              <th class="px-4 py-3">Contact</th>
              <th class="px-4 py-3">Location</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="list.loading.value">
              <tr v-for="i in 5" :key="i" class="border-t border-line"><td v-for="j in 5" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
            </template>
            <tr v-else-if="!list.rows.value.length">
              <td colspan="5" class="px-6 py-14 text-center">
                <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No reinsurers match your search" : `No ${tab.toLowerCase()} reinsurers` }}</p>
              </td>
            </tr>
            <tr v-for="r in list.rows.value" v-else :key="r.reinsurerUuid" class="border-t border-line hover:bg-surface-muted/60">
              <td class="px-4 py-3 font-semibold text-ink">{{ r.name }}</td>
              <td class="px-4 py-3 text-ink-muted">
                <p>{{ r.phone || "—" }}</p>
                <p v-if="r.email" class="text-xs">{{ r.email }}</p>
              </td>
              <td class="px-4 py-3 text-ink-muted">{{ [r.state, r.country].filter(Boolean).join(", ") || "—" }}</td>
              <td class="px-4 py-3"><LifeStatusBadge :status="r.status" /></td>
              <td class="px-4 py-3">
                <div class="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" @click="edit(r)">Edit</Button>
                  <Button v-if="r.status !== 'ACTIVE'" variant="ghost" size="sm" @click="setStatus(r, 'ACTIVE')">Activate</Button>
                  <Button v-else variant="ghost" size="sm" @click="setStatus(r, 'DISABLED')">Disable</Button>
                  <Button variant="ghost" size="sm" class="!text-error" @click="remove(r)">Delete</Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <LifePager v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" />
    </section>
  </div>
</template>
