<script setup>
// Riders on a group quotation or policy. Editable on a draft: create, change sum assured, remove.
import { computed, ref } from "vue";
import { toasted } from "@/utils/utils";
import RateTableEditor from "./RateTableEditor.vue";
import { useLifeResource } from "../composables/useLifeResource";
import { confirmAction } from "../composables/confirmAction";
import { quotedRiderSpec, riderChanges } from "../quotations/quotationRules";
import { createQuotedRider, deleteQuotedRider, getQuotedRiders, updateQuotedRider } from "../api/quotationApi";
import { getRiders } from "../api/productApi";

const props = defineProps({
  quotationUuid: { type: String, required: true },
  editable: { type: Boolean, default: false },
});
const emit = defineEmits(["count"]);

const quotedRiders = useLifeResource(() => getQuotedRiders({ quotationUuid: props.quotationUuid }), { initial: [] });
const library = useLifeResource(getRiders, { initial: [] });
const spec = computed(() => quotedRiderSpec(library.data.value || []));
const saving = ref(false);

async function load() {
  await Promise.all([quotedRiders.load(), library.load()]);
  emit("count", (quotedRiders.data.value || []).length);
}
load();

async function save(rows) {
  const { create, update } = riderChanges(rows, quotedRiders.data.value || [], props.quotationUuid);
  saving.value = true;
  const results = await Promise.all([create.length ? createQuotedRider(create) : null, update.length ? updateQuotedRider(update) : null]);
  saving.value = false;
  if (results.every((r) => r === null || r?.success)) toasted(true, "Riders saved");
  load();
}
function remove(row) {
  const name = library.data.value.find((r) => r.riderUuid === row.riderUuid)?.riderName || "this rider";
  confirmAction({ title: `Remove ${name}?`, message: "It is taken off this quotation.", confirmText: "Remove", tone: "danger" }, async () => {
    const res = await deleteQuotedRider(row.quotedRiderUuid);
    if (res?.success) { toasted(true, "Rider removed"); load(); }
  });
}
</script>

<template>
  <div class="grid gap-2">
    <p class="text-xs text-ink-muted">Riders add cover on top of the term benefit for every member. Sums assured must stay within each rider's limits; premiums are calculated by the system.</p>
    <RateTableEditor
      :spec="spec"
      :rows="quotedRiders.data.value"
      :loading="quotedRiders.loading.value || library.loading.value"
      :saving="saving"
      :load-error="quotedRiders.error.value || library.error.value"
      :readonly="!editable"
      keep-order
      :empty-hint="editable ? 'Add a row for each rider the institution wants.' : ''"
      @save="save"
      @remove="remove"
      @retry="load"
    />
  </div>
</template>
