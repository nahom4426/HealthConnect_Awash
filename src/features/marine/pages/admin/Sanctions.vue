<script setup>
// Approved sanctions list. An empty or expired list is unavailable, not a clear screening.
import { onMounted, ref } from "vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import FormField from "../../components/FormField.vue";
import ListTable from "../../components/ListTable.vue";
import { cardClass, inputClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { getSanctionsStatus, importSanctions, listSanctionsImports } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { formatDate, formatDateTime } from "../../utils/format";

const { data: status, loading, error, load } = useResource(getSanctionsStatus);
const { data: history, load: loadHistory } = useResource(listSanctionsImports, { initial: [] });
onMounted(() => {
  load();
  loadHistory();
});

const file = ref(null);
const source = ref("");
const version = ref("");
const effectiveFrom = ref("");
const effectiveUntil = ref("");
const pending = ref(false);
const errors = ref({});

function onFile(event) {
  file.value = event.target.files?.[0] ?? null;
}

async function submit() {
  errors.value = {};
  const fields = {};
  if (!file.value) fields.file = "A CSV file is required.";
  if (!source.value.trim()) fields.source = "Source is required.";
  if (!version.value.trim()) fields.version = "Version is required.";
  if (!effectiveFrom.value) fields.effectiveFrom = "Effective date is required.";
  if (effectiveUntil.value && effectiveFrom.value && effectiveUntil.value < effectiveFrom.value) {
    fields.effectiveUntil = "The end date must be on or after the effective date.";
  }
  if (Object.keys(fields).length) {
    errors.value = fields;
    return;
  }
  const body = new FormData();
  body.append("file", file.value);
  body.append("source", source.value.trim());
  body.append("version", version.value.trim());
  body.append("effectiveFrom", effectiveFrom.value);
  if (effectiveUntil.value) body.append("effectiveUntil", effectiveUntil.value);
  pending.value = true;
  const res = await importSanctions(body);
  pending.value = false;
  if (!res.ok) {
    if (res.error.status === 422) errors.value = res.error.fieldMap();
    else notifyError(res.error);
    return;
  }
  toasted(true, `Imported ${res.data.rowCount} entries`);
  file.value = null;
  load();
  loadHistory();
}

const columns = [
  { key: "importedAt", label: "Imported" },
  { key: "source", label: "Source" },
  { key: "version", label: "Version" },
  { key: "status", label: "Status" },
  { key: "rowCount", label: "Rows" },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      title="Sanctions list"
      subtitle="Screening stays unavailable until an approved list is in force."
      :crumbs="[{ label: 'Marine' }, { label: 'Sanctions list' }]"
    />
    <PageState v-if="loading && !status" kind="loading" />
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load()" />
    <template v-else-if="status">
      <section :class="[cardClass, 'p-4 mb-4']">
        <p class="text-sm font-semibold" :class="status.available ? 'text-success-strong' : 'text-warning-strong'">
          {{ status.available ? "A list is in force" : "Screening is unavailable" }}
        </p>
        <p v-if="status.reason" class="mt-1 text-sm text-ink">{{ status.reason }}</p>
        <p v-else class="mt-1 text-sm text-ink">
          {{ status.source }} {{ status.version }} · {{ status.rowCount }} entries
          · from {{ formatDate(status.effectiveFrom) }}
          <span v-if="status.effectiveUntil"> until {{ formatDate(status.effectiveUntil) }}</span>
        </p>
        <p class="mt-2 text-xs text-ink-muted">
          Approved sources:
          {{ status.approvedSources?.length ? status.approvedSources.join(", ") : "none configured" }}
        </p>
      </section>

      <form :class="[cardClass, 'p-4 mb-4 grid gap-3']" @submit.prevent="submit">
        <h2 class="text-sm font-semibold text-ink">Import a list</h2>
        <p class="text-sm text-ink-muted">CSV columns: name, list, type, country, identifier. Type is ENTITY, INDIVIDUAL, VESSEL or COUNTRY.</p>
        <FormField label="File" :error="errors.file" required>
          <input class="block w-full text-sm" type="file" accept=".csv,text/csv" @change="onFile" />
        </FormField>
        <div class="grid gap-3 md:grid-cols-2">
          <FormField label="Source" :error="errors.source" required>
            <input v-model="source" :class="inputClass" autocomplete="off" />
          </FormField>
          <FormField label="Version" :error="errors.version" required>
            <input v-model="version" :class="inputClass" autocomplete="off" />
          </FormField>
          <FormField label="Effective from" :error="errors.effectiveFrom" required>
            <input v-model="effectiveFrom" :class="inputClass" type="date" />
          </FormField>
          <FormField label="Effective until" :error="errors.effectiveUntil">
            <input v-model="effectiveUntil" :class="inputClass" type="date" />
          </FormField>
        </div>
        <div>
          <Button html-type="submit" :pending="pending">Import</Button>
        </div>
      </form>

      <ListTable :columns="columns" :list="history ?? []" empty-title="No imports yet">
        <template #cell-importedAt="{ row }">{{ formatDateTime(row.importedAt) }}</template>
        <template #cell-status="{ row }">{{ row.current ? "Current" : row.status }}</template>
      </ListTable>
    </template>
  </div>
</template>
