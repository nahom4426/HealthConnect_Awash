<script setup>
// FX rates (plan 4.4, MAR-24, MAR-25): today's rate per currency, an entry form for Finance,
// CSV import, and the history. Quotes fall back to the previous day's rate when today's is missing.
import { onMounted, ref } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import FormField from "../../components/FormField.vue";
import { cardClass, inputClass, inputBorder } from "../../components/styles";
import { useListQuery } from "../../composables/useListQuery";
import { useResource } from "../../composables/useResource";
import { useForm } from "../../composables/useForm";
import { useCan } from "../../composables/useCan";
import { createFxRate, getTodayFxRates, listFxRates } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { FOREIGN_CURRENCIES, FX_SOURCES } from "../../constants";
import { formatAmount, parseDecimal } from "../../utils/money";
import { formatDate, todayIso } from "../../utils/format";

const { can } = useCan();
const today = useResource(getTodayFxRates, { initial: [] });
onMounted(() => today.load());

const list = useListQuery(listFxRates, { filters: { currency: [], from: "", to: "" }, sort: "date,desc" });

const entry = ref(null);
const { form, errors, pending, check, validate, applyServerError } = useForm(
  { currency: "USD", date: todayIso(), rate: "" },
  {
    currency: (v) => (FOREIGN_CURRENCIES.includes(v) ? "" : "Pick a currency"),
    date: (v) => (!v ? "Date is required" : v > todayIso() ? "Date can't be in the future" : ""),
    rate: (v) => {
      const d = parseDecimal(v);
      if (!(d > 0n)) return "Rate must be greater than 0";
      if (String(v).includes(".") && String(v).split(".")[1].length > 4) return "At most 4 decimals";
      return "";
    },
  }
);

function fillMissing(currency) {
  form.currency = currency;
  form.date = todayIso();
  form.rate = "";
  entry.value?.scrollIntoView({ behavior: "smooth", block: "center" });
  entry.value?.querySelector("[data-field=rate] input")?.focus({ preventScroll: true });
}

async function save() {
  if (!validate()) return;
  pending.value = true;
  const res = await createFxRate({ ...form });
  pending.value = false;
  if (res.ok) {
    toasted(true, `${res.data.currency} rate for ${formatDate(res.data.date)} saved`);
    form.rate = "";
    today.reload();
    list.load();
  } else if (!applyServerError(res.error)) notifyError(res.error);
}

function importCsv() {
  openModal("MarineFxImport", {}, (r) => {
    if (r?.imported) {
      today.reload();
      list.load();
    }
  });
}

const columns = [
  { key: "date", label: "Date", sortable: true },
  { key: "currency", label: "Currency", sortable: true },
  { key: "rate", label: "Rate to ETB", align: "right", sortable: true },
  { key: "source", label: "Source" },
  { key: "enteredBy", label: "Entered by" },
];
</script>

<template>
  <div class="p-4 md:p-6">
    <MarinePageHeader title="FX rates" subtitle="ETB per unit of each foreign currency. Quotes use today's rate, or the previous day's when today's is missing." :crumbs="[{ label: 'Marine' }, { label: 'Admin' }, { label: 'FX rates' }]">
      <template #actions>
        <Button v-if="can('fx.edit')" variant="outline" @click="importCsv">Import CSV</Button>
      </template>
    </MarinePageHeader>

    <section aria-labelledby="fx-today" class="mb-6">
      <h2 id="fx-today" class="mb-2 text-sm font-semibold text-ink">Today, {{ formatDate(todayIso()) }}</h2>
      <div class="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <template v-if="today.loading.value && !today.data.value.length">
          <div v-for="i in 5" :key="i" class="h-20 rounded-2xl animate-pulse bg-surface-raised"></div>
        </template>
        <div v-for="t in today.data.value" v-else :key="t.currency" :class="[cardClass, 'p-4']">
          <p class="text-xs font-semibold tracking-wide uppercase text-ink-subtle">{{ t.currency }}</p>
          <p v-if="t.rate" class="mt-1 text-lg font-semibold tabular-nums text-ink">{{ formatAmount(t.rate, 4) }}</p>
          <template v-else>
            <p class="inline-flex mt-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Missing for today</p>
            <button v-if="can('fx.edit')" type="button" class="block mt-1 text-xs font-medium text-primary hover:underline" @click="fillMissing(t.currency)">Enter rate</button>
          </template>
        </div>
      </div>
    </section>

    <section v-if="can('fx.edit')" ref="entry" aria-labelledby="fx-entry" :class="[cardClass, 'p-4 mb-6']">
      <h2 id="fx-entry" class="mb-3 text-sm font-semibold text-ink">Enter a rate</h2>
      <form class="flex flex-wrap gap-4 items-start" novalidate @submit.prevent="save">
        <FormField v-slot="{ id, invalid }" label="Currency" name="currency" :error="errors.currency">
          <select :id="id" v-model="form.currency" :class="[inputClass, inputBorder(invalid), '!w-32']">
            <option v-for="c in FOREIGN_CURRENCIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Date" name="date" :error="errors.date">
          <input :id="id" v-model="form.date" type="date" :max="todayIso()" :class="[inputClass, inputBorder(invalid), '!w-44']" @blur="check('date')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Rate to ETB" name="rate" :error="errors.rate" hint="Up to 4 decimals">
          <input :id="id" v-model="form.rate" inputmode="decimal" placeholder="156.0412" :class="[inputClass, inputBorder(invalid), '!w-44 text-right tabular-nums']" @blur="check('rate')" />
        </FormField>
        <Button html-type="submit" class="mt-6" :pending="pending">Save rate</Button>
      </form>
    </section>

    <h2 class="mb-2 text-sm font-semibold text-ink">History</h2>
    <FilterBar
      :fields="[
        { type: 'multi', key: 'currency', label: 'Currency', options: FOREIGN_CURRENCIES.map((c) => ({ value: c, label: c })) },
        { type: 'dateRange', from: 'from', to: 'to', label: 'Date' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" empty-title="No rates yet">
      <template #cell-date="{ row }">{{ formatDate(row.date) }}</template>
      <template #cell-rate="{ row }">{{ formatAmount(row.rate, 4) }}</template>
      <template #cell-source="{ row }">{{ FX_SOURCES[row.source] ?? row.source }}</template>
    </ListTable>
  </div>
</template>
