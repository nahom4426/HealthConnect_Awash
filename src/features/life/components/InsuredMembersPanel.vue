<script setup>
// Members of a group quotation or policy (both keyed by quotationUuid). Editable only on a draft:
// add, edit, remove, Excel template and import. Premiums and rates are the backend's.
import { ref, watch } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import LifePager from "./LifePager.vue";
import LifeStatusBadge from "./LifeStatusBadge.vue";
import { fileForm } from "../composables/useLifeResource";
import { useLifePagedList } from "../composables/useLifePagedList";
import { confirmAction } from "../composables/confirmAction";
import { formatAmount, formatDate } from "../constants/labels";
import { insuredName } from "../quotations/quotationRules";
import { deleteInsuredPerson, exportInsuredPersonSample, getInsuredPersonListReinsured, getInsuredPersons, importInsuredPerson } from "../api/quotationApi";

const props = defineProps({
  /** QuotationResponse or PolicyResponse (needs quotationUuid, institutionUuid) */
  quotation: { type: Object, required: true },
  editable: { type: Boolean, default: false },
  /** show each member's cover dates and status (issued policies) */
  showCover: { type: Boolean, default: false },
});
/** count: whether the unfiltered list has any member (for the draft checklist) */
const emit = defineEmits(["count"]);

const uuid = props.quotation.quotationUuid;
const reinsuredOnly = ref(false);
const members = useLifePagedList((p) => (reinsuredOnly.value ? getInsuredPersonListReinsured(uuid, p) : getInsuredPersons(uuid, p)));
members.reload();
watch(reinsuredOnly, () => { members.page.value = 1; members.reload(); });
watch(members.rows, (rows) => { if (!reinsuredOnly.value && !members.search.value && members.page.value === 1) emit("count", rows.length); });

const add = () => openModal("LifeInsuredForm", { quotation: props.quotation }, (saved) => saved && members.reload());
const edit = (p) => openModal("LifeInsuredForm", { quotation: props.quotation, insured: p }, (saved) => saved && members.reload());
function remove(p) {
  confirmAction({ title: `Remove ${insuredName(p)}?`, message: "The member is taken off this quotation.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteInsuredPerson(p.insuredUuid);
    if (res?.success) { toasted(true, "Member removed"); members.reload(); }
  });
}

const fileInput = ref(null);
const importing = ref(false);
async function onImport(e) {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  importing.value = true;
  const res = await importInsuredPerson(fileForm(file), { institutionUuid: props.quotation.institutionUuid, qutoationUuid: uuid });
  importing.value = false;
  if (res?.success) { toasted(true, res.data?.message || "Members imported"); members.page.value = 1; members.reload(); }
}
async function downloadTemplate() {
  const res = await exportInsuredPersonSample();
  if (!res?.success || !(res.data instanceof Blob)) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(res.data);
  a.download = "life-insured-members-template.xlsx";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const cols = () => 7 + (props.showCover ? 2 : 0) + (props.editable ? 1 : 0);
defineExpose({ reload: members.reload });
</script>

<template>
  <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
    <div class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 border-b border-line">
      <div class="flex flex-wrap gap-3 items-center">
        <input v-model="members.search.value" type="search" placeholder="Search members" aria-label="Search members" class="px-3 w-60 h-9 text-sm rounded-lg border outline-none bg-surface-muted border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
        <label class="inline-flex gap-2 items-center text-sm cursor-pointer text-ink-muted">
          <input v-model="reinsuredOnly" type="checkbox" class="w-4 h-4 rounded accent-primary" />
          Above retention only
        </label>
      </div>
      <div v-if="editable" class="flex flex-wrap gap-2">
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onImport" />
        <Button variant="ghost" size="sm" @click="downloadTemplate">Excel template</Button>
        <Button variant="outline" size="sm" :pending="importing" @click="fileInput?.click()">Import Excel</Button>
        <Button size="sm" @click="add">Add member</Button>
      </div>
    </div>
    <div v-if="members.error.value && !members.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load members</p>
      <p class="max-w-md text-sm text-ink-muted">{{ members.error.value }}</p>
      <Button variant="outline" size="sm" @click="members.reload()">Try again</Button>
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-surface-muted">
          <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
            <th class="px-4 py-3">Member</th>
            <th class="px-4 py-3">Gender</th>
            <th class="px-4 py-3">Born</th>
            <th class="px-4 py-3 text-right">Sum assured</th>
            <th class="px-4 py-3 text-right">Rate</th>
            <th class="px-4 py-3 text-right">Premium</th>
            <th class="px-4 py-3">Riders</th>
            <template v-if="showCover">
              <th class="px-4 py-3">Cover</th>
              <th class="px-4 py-3">Status</th>
            </template>
            <th v-if="editable" class="px-4 py-3"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="members.loading.value">
            <tr v-for="i in 5" :key="i" class="border-t border-line"><td v-for="j in cols()" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
          </template>
          <tr v-else-if="!members.rows.value.length">
            <td :colspan="cols()" class="px-6 py-14 text-center">
              <p class="text-sm font-semibold text-ink">{{ members.search.value ? "No members match your search" : reinsuredOnly ? "No members above the retention limit" : "No members yet" }}</p>
              <p v-if="editable && !members.search.value && !reinsuredOnly" class="mt-1 text-sm text-ink-muted">Import the institution's staff list from the Excel template, or add members one by one.</p>
            </td>
          </tr>
          <tr v-for="p in members.rows.value" v-else :key="p.insuredUuid" class="border-t border-line hover:bg-surface-muted/60">
            <td class="px-4 py-3">
              <span class="font-medium text-ink">{{ insuredName(p) }}</span>
              <span class="block text-xs text-ink-subtle">{{ [p.insuranceId, p.position, p.phone].filter(Boolean).join(" · ") }}</span>
            </td>
            <td class="px-4 py-3 text-ink-muted">{{ p.gender || "—" }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(p.birthDate) }}</td>
            <td class="px-4 py-3 text-right tabular-nums text-ink">{{ formatAmount(p.sumAssured) }}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap tabular-nums text-ink-muted">{{ p.rate != null ? `${p.rate} / ${p.rateUnit ?? "—"}` : "—" }}</td>
            <td class="px-4 py-3 text-right tabular-nums text-ink">{{ formatAmount(p.premium) }}</td>
            <td class="px-4 py-3 text-ink-muted">
              <span v-if="p.quotedRiders?.length" :title="p.quotedRiders.map((r) => `${r.riderName}: ${formatAmount(r.premium)}`).join('\n')">{{ p.quotedRiders.length }} rider{{ p.quotedRiders.length === 1 ? "" : "s" }}</span>
              <span v-else>—</span>
            </td>
            <template v-if="showCover">
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ p.beginDate ? `${formatDate(p.beginDate)} – ${formatDate(p.endDate)}` : "—" }}</td>
              <td class="px-4 py-3"><LifeStatusBadge v-if="p.status" :status="p.status" /></td>
            </template>
            <td v-if="editable" class="px-4 py-3">
              <div class="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" @click="edit(p)">Edit</Button>
                <Button variant="ghost" size="sm" class="!text-error" @click="remove(p)">Remove</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <LifePager v-model:page="members.page.value" :total-pages="members.totalPages.value" :disabled="members.loading.value" />
  </section>
</template>
