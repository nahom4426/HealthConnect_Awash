<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { formatCurrency } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { getModifiedRiders, getPendingRiders, getRiders } from "../../api/productApi";

const router = useRouter();
// The backend keeps riders in versions: pending (draft), active (in use), modified (superseded)
const TABS = { Active: getRiders, Pending: getPendingRiders, Modified: getModifiedRiders };
const tab = ref("Active");
const search = ref("");

const { data: riders, loading, error, load } = useLifeResource((t) => TABS[t](), { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
watch(tab, (t) => load(t), { immediate: true });

const visible = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return riders.value;
  return riders.value.filter((r) => `${r.riderName} ${r.riderDescription}`.toLowerCase().includes(q));
});

function newRider() {
  openModal("LifeRiderForm", {}, (saved) => {
    if (saved?.riderUuid) router.push(`/life/products/riders/${saved.riderUuid}`);
  });
}

const money = (v) => (v === null || v === undefined ? "—" : formatCurrency(v));
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader title="Riders" subtitle="Additional covers sold with term life — accidental death, disability and others — each with its own individual and group rate tables.">
      <template #actions>
        <Button @click="newRider">New rider</Button>
      </template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input
        v-model="search"
        type="search"
        placeholder="Search riders"
        aria-label="Search riders"
        class="px-3 w-64 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="error && !loading" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load riders</p>
        <p class="max-w-md text-sm text-ink-muted">{{ error }}</p>
        <Button variant="outline" size="sm" @click="load(tab)">Try again</Button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th class="px-4 py-3">Rider</th>
              <th class="px-4 py-3 text-right">Sum assured range</th>
              <th class="px-4 py-3 text-right">Rate rows</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3"><span class="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr v-for="i in 5" :key="i" class="border-t border-line">
                <td v-for="j in 5" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td>
              </tr>
            </template>
            <tr v-else-if="!visible.length">
              <td colspan="5" class="px-6 py-14 text-center">
                <p class="text-sm font-semibold text-ink">{{ search ? "No riders match your search" : `No ${tab.toLowerCase()} riders` }}</p>
                <p v-if="!search && tab === 'Active'" class="mt-1 text-sm text-ink-muted">Create a rider, add its rates, then activate it.</p>
              </td>
            </tr>
            <tr
              v-for="r in visible"
              v-else
              :key="r.riderUuid"
              class="border-t cursor-pointer border-line hover:bg-surface-muted/60"
              @click="router.push(`/life/products/riders/${r.riderUuid}`)"
            >
              <td class="px-4 py-3">
                <p class="font-semibold text-ink">{{ r.riderName }}</p>
                <p v-if="r.riderDescription" class="mt-0.5 max-w-lg text-xs truncate text-ink-muted">{{ r.riderDescription }}</p>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap tabular-nums text-ink">{{ money(r.minLimit) }} – {{ money(r.maxLimit) }}</td>
              <td class="px-4 py-3 text-right whitespace-nowrap tabular-nums text-ink-muted">
                {{ r.individualRiders?.length ?? 0 }} individual · {{ r.groupRiders?.length ?? 0 }} group
              </td>
              <td class="px-4 py-3"><LifeStatusBadge :status="r.status" /></td>
              <td class="px-4 py-3 text-right">
                <RouterLink :to="`/life/products/riders/${r.riderUuid}`" class="text-sm font-semibold text-primary hover:underline" @click.stop>Open</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
