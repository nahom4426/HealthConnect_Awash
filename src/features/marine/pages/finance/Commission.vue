<script setup>
// Broker commission: earned on net premium (excluding VAT and stamp duty) when the premium is received,
// clawed back when it's refunded. Finance bills it per broker in a statement up to a month, then pays
// the statement. Rates: a default and per-broker overrides.
import { computed, onMounted, ref } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import PageState from "../../components/PageState.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import PartyPicker from "../../components/PartyPicker.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { useListQuery } from "../../composables/useListQuery";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { createCommissionStatement, getCommissionRates, listCommissionStatements, listUnbilledCommission, saveCommissionRates } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate, todayIso } from "../../utils/format";

const { can, roles } = useCan();
const unbilled = useResource(listUnbilledCommission, { initial: [] });
const statements = useListQuery(listCommissionStatements, { filters: {}, sort: "createdAt,desc" });
const rates = useResource(getCommissionRates);
onMounted(() => {
  unbilled.load();
  rates.load();
});

// ── billing ──
const month = ref(todayIso().slice(0, 7));
const open = ref("");
async function bill(row) {
  const res = await createCommissionStatement({ brokerId: row.broker.id, month: month.value });
  if (!res.ok) return notifyError(res.error);
  toasted(true, `${res.data.statementNo} for ${row.broker.name}: ETB ${formatAmount(res.data.total)}`);
  unbilled.load();
  statements.load();
}
function pay(st) {
  openModal(
    "MarineRecordPayment",
    { kind: "statement", id: st.id, title: `Pay ${st.statementNo}`, details: [{ label: "Broker", value: st.broker?.name }, { label: "Up to", value: st.month }, { label: "Commission", value: formatMoney(st.total) }] },
    (done) => done && statements.load()
  );
}
const columns = [
  { key: "statementNo", label: "Statement", sortable: true },
  { key: "broker", label: "Broker" },
  { key: "month", label: "Up to month" },
  { key: "lines", label: "Lines", align: "right" },
  { key: "total", label: "Commission (ETB)", align: "right" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

// ── rates ──
const canEditRates = computed(() => roles.value.some((r) => ["FINANCE", "ADMIN"].includes(r)));
const draft = ref(null);
const rateErrors = ref({});
const saving = ref(false);
function editRates() {
  draft.value = { defaultPct: rates.data.value.defaultPct, brokers: rates.data.value.brokers.map((b) => ({ broker: b.broker, pct: b.pct })) };
  rateErrors.value = {};
}
async function saveRates() {
  saving.value = true;
  const res = await saveCommissionRates({ defaultPct: draft.value.defaultPct, brokers: draft.value.brokers.map((b) => ({ brokerId: b.broker?.id ?? null, pct: b.pct })) });
  saving.value = false;
  if (!res.ok) {
    if (res.error.status === 422) rateErrors.value = res.error.fieldMap();
    else notifyError(res.error);
    return;
  }
  toasted(true, "Commission rates saved. They apply to premium received from now on.");
  draft.value = null;
  rates.load();
}
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Broker commission" subtitle="Earned on net premium when it's received, billed per broker in statements." :crumbs="[{ label: 'Marine' }, { label: 'Finance' }, { label: 'Commission' }]" />
    <DetailTabs :tabs="[{ key: 'bill', label: 'To bill', count: unbilled.data.value.length || undefined }, { key: 'statements', label: 'Statements' }, { key: 'rates', label: 'Rates' }]">
      <template #bill>
        <div class="flex flex-wrap gap-3 items-end mb-4 marine-filters">
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Bill everything earned up to
            <input v-model="month" type="month" :max="todayIso().slice(0, 7)" :class="[inputClass, 'border-line !w-48 !h-9']" />
          </label>
          <p class="pb-2 text-xs text-ink-muted">Each broker's lines up to the end of this month go on one statement.</p>
        </div>
        <PageState v-if="unbilled.loading.value && !unbilled.data.value.length" kind="loading" />
        <PageState v-else-if="!unbilled.data.value.length" kind="empty" title="Nothing to bill" message="Commission is earned when a broker's customer pays their premium." />
        <div v-else class="grid gap-4">
          <section v-for="row in unbilled.data.value" :key="row.broker.id" :class="[cardClass, 'overflow-hidden']">
            <header class="flex flex-wrap gap-3 justify-between items-center px-4 py-3">
              <h2 class="text-sm font-semibold text-ink">{{ row.broker.name }}</h2>
              <span class="flex gap-3 items-center">
                <span class="text-sm text-ink-muted">{{ row.lines.length }} lines · <span class="font-bold tabular-nums text-ink">ETB {{ formatAmount(row.total) }}</span></span>
                <button type="button" class="text-sm font-medium text-primary hover:underline" :aria-expanded="open === row.broker.id" @click="open = open === row.broker.id ? '' : row.broker.id">{{ open === row.broker.id ? "Hide lines" : "Show lines" }}</button>
                <Button v-if="can('finance.post')" size="sm" :disabled="Number(row.total) <= 0" @click="bill(row)">Create statement</Button>
              </span>
            </header>
            <table v-if="open === row.broker.id" class="w-full text-sm border-t border-line">
              <thead class="bg-surface-muted"><tr class="text-[11px] font-bold tracking-wider text-left uppercase"><th class="px-4 py-2">Earned</th><th class="px-4 py-2">Note</th><th class="px-4 py-2">Policy</th><th class="px-4 py-2 text-right">Net premium</th><th class="px-4 py-2 text-right">Rate</th><th class="px-4 py-2 text-right">Commission</th></tr></thead>
              <tbody>
                <tr v-for="l in row.lines" :key="l.id" class="border-t border-line">
                  <td class="px-4 py-2 whitespace-nowrap">{{ formatDate(l.earnedOn) }}</td>
                  <td class="px-4 py-2"><RouterLink :to="`/marine/finance/notes/${l.noteId}`" class="hover:text-primary">{{ l.noteNo }}</RouterLink></td>
                  <td class="px-4 py-2">{{ l.policyNo ?? "—" }}</td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ formatAmount(l.base) }}</td>
                  <td class="px-4 py-2 text-right tabular-nums">{{ l.pct }}%</td>
                  <td :class="['px-4 py-2 text-right tabular-nums', Number(l.amount) < 0 ? 'text-error-strong' : '']">{{ formatAmount(l.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </template>

      <template #statements>
        <ListTable :columns="columns" :list="statements" empty-title="No statements yet">
          <template #cell-statementNo="{ row }"><span class="font-semibold whitespace-nowrap text-ink">{{ row.statementNo }}</span></template>
          <template #cell-broker="{ row }">{{ row.broker?.name }}</template>
          <template #cell-lines="{ row }">{{ row.lines.length }}</template>
          <template #cell-total="{ row }">{{ formatAmount(row.total) }}</template>
          <template #cell-status="{ row }"><StatusBadge entity="statement" :status="row.status" /><p v-if="row.paidOn" class="text-xs text-ink-muted">{{ formatDate(row.paidOn) }} · {{ row.reference }}</p></template>
          <template #cell-actions="{ row }"><span class="flex justify-end"><Button v-if="can('finance.post') && row.status === 'OPEN'" size="sm" variant="success" @click.stop="pay(row)">Pay</Button></span></template>
        </ListTable>
      </template>

      <template #rates>
        <PageState v-if="!rates.data.value" kind="loading" />
        <section v-else :class="[cardClass, 'p-4 max-w-2xl']">
          <h2 class="mb-3 text-sm font-semibold text-ink">Commission rates</h2>
          <template v-if="!draft">
            <dl class="grid gap-2 text-sm">
              <div class="flex justify-between"><dt class="text-ink-muted">Default</dt><dd class="font-semibold tabular-nums">{{ rates.data.value.defaultPct }}%</dd></div>
              <div v-for="b in rates.data.value.brokers" :key="b.brokerId" class="flex justify-between"><dt class="text-ink-muted">{{ b.broker?.name }}</dt><dd class="font-semibold tabular-nums">{{ b.pct }}%</dd></div>
            </dl>
            <Button v-if="canEditRates" class="mt-4" variant="outline" size="sm" @click="editRates">Change rates</Button>
          </template>
          <form v-else class="grid gap-3" novalidate @submit.prevent="saveRates">
            <label class="flex flex-col gap-1 text-sm font-medium text-ink">
              Default rate %
              <input v-model="draft.defaultPct" inputmode="decimal" :class="[inputClass, inputBorder(rateErrors.defaultPct), '!w-32 tabular-nums']" />
              <span v-if="rateErrors.defaultPct" class="text-xs text-error">{{ rateErrors.defaultPct }}</span>
            </label>
            <p class="text-sm font-medium text-ink">Broker overrides</p>
            <div v-for="(b, i) in draft.brokers" :key="i" class="grid grid-cols-[1fr_7rem_auto] gap-2 items-start">
              <PartyPicker v-model="b.broker" type="BROKER" :can-create="false" :invalid="!!rateErrors[`brokers.${i}.brokerId`]" />
              <input v-model="b.pct" inputmode="decimal" :aria-label="`Rate % for row ${i + 1}`" :class="[inputClass, inputBorder(rateErrors[`brokers.${i}.pct`]), 'tabular-nums']" />
              <button type="button" class="mt-2 text-sm font-medium text-error hover:underline" @click="draft.brokers.splice(i, 1)">Remove</button>
              <span v-if="rateErrors[`brokers.${i}.brokerId`] || rateErrors[`brokers.${i}.pct`]" class="col-span-3 text-xs text-error">{{ rateErrors[`brokers.${i}.brokerId`] || rateErrors[`brokers.${i}.pct`] }}</span>
            </div>
            <Button variant="outline" size="sm" class="justify-self-start" @click="draft.brokers.push({ broker: null, pct: '' })">Add broker</Button>
            <div class="flex gap-2 justify-end pt-2 border-t border-line">
              <Button variant="outline" @click="draft = null">Cancel</Button>
              <Button html-type="submit" :pending="saving">Save rates</Button>
            </div>
          </form>
        </section>
      </template>
    </DetailTabs>
  </div>
</template>
