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
import { TreatyStatus } from "../../constants/statuses";
import { deleteFclMedicalParameter, getFclMedicalParameters, updateFclMedicalParameterStatus } from "../../api/reinsuranceApi";

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
    <LifePageHeader title="Medical tests" subtitle="Evidence of health a reinsurer can ask for when a life is above the free cover limit — referenced by each treaty's medical underwriting ranges.">
      <template #actions><Button @click="edit()">Add test</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input v-model="list.search.value" type="search" placeholder="Search tests" aria-label="Search tests" class="px-3 w-64 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load medical tests</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.reload()">Try again</Button>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-surface-muted">
          <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
            <th class="px-4 py-3 w-28">Code</th>
            <th class="px-4 py-3">Test</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 text-right"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="list.loading.value">
            <tr v-for="i in 5" :key="i" class="border-t border-line"><td v-for="j in 4" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
          </template>
          <tr v-else-if="!list.rows.value.length">
            <td colspan="4" class="px-6 py-14 text-center">
              <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No tests match your search" : `No ${tab.toLowerCase()} medical tests` }}</p>
            </td>
          </tr>
          <tr v-for="t in list.rows.value" v-else :key="t.fclMedicalParameterUuid" class="border-t border-line hover:bg-surface-muted/60">
            <td class="px-4 py-3"><span class="px-2 py-1 font-mono text-xs font-semibold rounded-md bg-surface-raised text-ink">{{ t.label }}</span></td>
            <td class="px-4 py-3 text-ink">{{ t.medicalTestDescription }}</td>
            <td class="px-4 py-3"><LifeStatusBadge :status="t.status" /></td>
            <td class="px-4 py-3">
              <div class="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" @click="edit(t)">Edit</Button>
                <Button v-if="t.status !== 'ACTIVE'" variant="ghost" size="sm" @click="setStatus(t, 'ACTIVE')">Activate</Button>
                <Button v-else variant="ghost" size="sm" @click="setStatus(t, 'REVISED')">Retire</Button>
                <Button variant="ghost" size="sm" class="!text-error" @click="remove(t)">Delete</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <LifePager v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" />
    </section>
  </div>
</template>
