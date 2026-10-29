<script setup>
// Members of a group quotation or policy (both keyed by quotationUuid). Editable only on a draft:
// add, edit, remove, Excel template and import. Premiums and rates are the backend's.
import { computed, ref, watch } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import CheckboxField from "@/components/fields/CheckboxField.vue";
import { toasted } from "@/utils/utils";
import PageNav from "@/components/PageNav.vue";
import StatusBadge from "@/components/StatusBadge.vue";
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

const columns = computed(() => [
  { key: "member", label: "Member" },
  { key: "gender", label: "Gender" },
  { key: "birthDate", label: "Born" },
  { key: "sumAssured", label: "Sum assured", align: "right" },
  { key: "rate", label: "Rate", align: "right" },
  { key: "premium", label: "Premium", align: "right" },
  { key: "riders", label: "Riders" },
  ...(props.showCover ? [{ key: "cover", label: "Cover" }, { key: "status", label: "Status" }] : []),
  ...(props.editable ? [{ key: "actions", label: "Actions", srOnly: true }] : []),
]);
defineExpose({ reload: members.reload });
</script>

<template>
  <ListTable
    :columns="columns"
    :rows="members.rows.value"
    row-key="insuredUuid"
    :loading="members.loading.value"
    :error="members.error.value"
    error-title="Couldn't load members"
    @retry="members.reload()"
  >
    <template #toolbar>
      <div class="flex flex-wrap gap-3 justify-between items-center px-4 py-3 border-b border-line">
        <div class="flex flex-wrap gap-3 items-center">
          <div class="w-60"><TextField v-model="members.search.value" type="search" placeholder="Search members" aria-label="Search members" /></div>
          <CheckboxField v-model="reinsuredOnly" label="Above retention only" />
        </div>
        <div v-if="editable" class="flex flex-wrap gap-2">
          <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onImport" />
          <Button variant="ghost" size="sm" @click="downloadTemplate">Excel template</Button>
          <Button variant="outline" size="sm" :pending="importing" @click="fileInput?.click()">Import Excel</Button>
          <Button size="sm" @click="add">Add member</Button>
        </div>
      </div>
    </template>
    <template #empty>
      <p class="text-sm font-semibold text-ink">{{ members.search.value ? "No members match your search" : reinsuredOnly ? "No members above the retention limit" : "No members yet" }}</p>
      <p v-if="editable && !members.search.value && !reinsuredOnly" class="mt-1 text-sm text-ink-muted">Import the institution's staff list from the Excel template, or add members one by one.</p>
    </template>
    <template #cell-member="{ row }">
      <span class="font-medium text-ink">{{ insuredName(row) }}</span>
      <span class="block text-xs text-ink-subtle">{{ [row.insuranceId, row.position, row.phone].filter(Boolean).join(" · ") }}</span>
    </template>
    <template #cell-gender="{ row }"><span class="text-ink-muted">{{ row.gender || "—" }}</span></template>
    <template #cell-birthDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.birthDate) }}</span></template>
    <template #cell-sumAssured="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.sumAssured) }}</span></template>
    <template #cell-rate="{ row }"><span class="whitespace-nowrap tabular-nums text-ink-muted">{{ row.rate != null ? `${row.rate} / ${row.rateUnit ?? "—"}` : "—" }}</span></template>
    <template #cell-premium="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.premium) }}</span></template>
    <template #cell-riders="{ row }">
      <span v-if="row.quotedRiders?.length" class="text-ink-muted" :title="row.quotedRiders.map((r) => `${r.riderName}: ${formatAmount(r.premium)}`).join('\n')">{{ row.quotedRiders.length }} rider{{ row.quotedRiders.length === 1 ? "" : "s" }}</span>
      <span v-else class="text-ink-muted">—</span>
    </template>
    <template #cell-cover="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ row.beginDate ? `${formatDate(row.beginDate)} – ${formatDate(row.endDate)}` : "—" }}</span></template>
    <template #cell-status="{ row }"><StatusBadge v-if="row.status" :status="row.status" /></template>
    <template #cell-actions="{ row }">
      <div class="flex gap-1 justify-end">
        <Button variant="ghost" size="sm" @click="edit(row)">Edit</Button>
        <Button variant="ghost" size="sm" class="!text-error" @click="remove(row)">Remove</Button>
      </div>
    </template>
    <template #footer><PageNav v-model:page="members.page.value" :total-pages="members.totalPages.value" :disabled="members.loading.value" /></template>
  </ListTable>
</template>
