<script setup>
// Import FX rates from CSV (plan 4.4): template download, file pick, preview with per-row
// errors, then import. Closes with { imported, rejected } after an import.
import { computed, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { importFxRates } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { parseFxCsv } from "../utils/fxCsv";
import { parseDecimal } from "../utils/money";
import { todayIso, formatDate } from "../utils/format";
import { FOREIGN_CURRENCIES } from "../constants";

const file = ref(null);
const rows = ref([]);
const pending = ref(false);
const result = ref(null);

function rowError(r) {
  if (r.error) return r.error;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) return "Date must be YYYY-MM-DD";
  if (r.date > todayIso()) return "Date can't be in the future";
  if (!FOREIGN_CURRENCIES.includes(r.currency)) return `Currency must be one of ${FOREIGN_CURRENCIES.join(", ")}`;
  const d = parseDecimal(r.rate);
  if (!(d > 0n)) return "Rate must be greater than 0";
  if (r.rate.includes(".") && r.rate.split(".")[1].length > 4) return "At most 4 decimals";
  return "";
}

async function pick(e) {
  const f = e.target.files?.[0];
  result.value = null;
  file.value = f ?? null;
  rows.value = f ? parseFxCsv(await f.text()).map((r) => ({ ...r, problem: rowError(r) })) : [];
}

const valid = computed(() => rows.value.filter((r) => !r.problem));

function downloadTemplate() {
  const csv = `date,currency,rate\n${todayIso()},USD,156.0412\n${todayIso()},EUR,169.7720\n`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "fx-rates-template.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

async function submit() {
  if (!file.value || !valid.value.length) return;
  pending.value = true;
  const res = await importFxRates(file.value);
  pending.value = false;
  if (res.ok) {
    result.value = res.data;
    toasted(true, `${res.data.imported} rates imported${res.data.rejected ? `, ${res.data.rejected} rejected` : ""}`);
  } else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="mdd" title="Import FX rates">
      <div class="flex flex-wrap gap-3 justify-between items-center">
        <p class="text-sm text-ink-muted">One rate per line: <code class="px-1 rounded bg-surface-muted">date,currency,rate</code> with rates in ETB per unit, up to 4 decimals.</p>
        <Button variant="outline" size="sm" @click="downloadTemplate">Download template</Button>
      </div>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        CSV file
        <input type="file" accept=".csv,text/csv" class="text-sm file:mr-3 file:px-3 file:h-9 file:rounded-lg file:border file:border-line file:bg-surface file:text-ink" @change="pick" />
      </label>

      <div v-if="result" class="p-3 text-sm rounded-xl bg-success-soft text-success-strong" role="status">
        Imported {{ result.imported }} · rejected {{ result.rejected }}
        <ul v-if="result.errors?.length" class="mt-1 text-xs text-ink">
          <li v-for="e in result.errors" :key="e.row">Line {{ e.row }}: {{ e.message }}</li>
        </ul>
      </div>

      <div v-else-if="rows.length" class="overflow-auto max-h-80 rounded-xl border border-line">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-surface-muted">
            <tr class="text-xs font-semibold text-left uppercase text-ink-subtle">
              <th class="px-3 py-2">Line</th><th class="px-3 py-2">Date</th><th class="px-3 py-2">Currency</th><th class="px-3 py-2 text-right">Rate</th><th class="px-3 py-2">Check</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.line" :class="['border-t border-line', r.problem ? 'bg-error-soft/40' : '']">
              <td class="px-3 py-1.5 text-ink-subtle">{{ r.line }}</td>
              <td class="px-3 py-1.5">{{ r.date ? formatDate(r.date) : "—" }}</td>
              <td class="px-3 py-1.5">{{ r.currency ?? "—" }}</td>
              <td class="px-3 py-1.5 text-right tabular-nums">{{ r.rate ?? "—" }}</td>
              <td :class="['px-3 py-1.5 text-xs', r.problem ? 'text-error-strong' : 'text-success-strong']">{{ r.problem || "OK" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <template #bottom>
        <div class="flex gap-2 justify-between items-center p-4 w-full border-t border-line">
          <span class="text-xs text-ink-muted">{{ rows.length && !result ? `${valid.length} valid · ${rows.length - valid.length} with errors (duplicates are checked on import)` : "" }}</span>
          <div class="flex gap-2">
            <Button variant="outline" @click="closeModal(result)">{{ result ? "Done" : "Cancel" }}</Button>
            <Button v-if="!result" :disabled="!valid.length" :pending="pending" @click="submit">Import valid rows</Button>
          </div>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
