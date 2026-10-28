<script setup>
// Change history of one record: who, when, and each field before and after.
import { watch } from "vue";
import PageState from "./PageState.vue";
import { getAudit } from "../api/marineApi";
import { useResource } from "../composables/useResource";
import { formatDateTime } from "../utils/format";

const props = defineProps({
  entity: { type: String, required: true },
  entityId: { type: String, required: true },
});

const { data, loading, error, load } = useResource((e, id) => getAudit(e, id), { initial: [] });
watch(() => [props.entity, props.entityId], () => load(props.entity, props.entityId), { immediate: true });

const show = (v) => (v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
defineExpose({ reload: () => load(props.entity, props.entityId) });
</script>

<template>
  <PageState v-if="loading && !data.length" kind="loading" />
  <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(entity, entityId)" />
  <PageState v-else-if="!data.length" kind="empty" title="No changes recorded yet" />
  <ol v-else class="relative pl-5 border-l border-line">
    <li v-for="a in data" :key="a.id" class="mb-5 last:mb-0">
      <span class="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true"></span>
      <p class="text-sm text-ink"><span class="font-semibold">{{ a.action }}</span> by {{ a.by }}</p>
      <p class="text-xs text-ink-subtle">{{ formatDateTime(a.at) }}</p>
      <ul v-if="a.changes?.length" class="mt-1.5 space-y-0.5 text-xs">
        <li v-for="c in a.changes" :key="c.field" class="text-ink-muted">
          <span class="font-medium text-ink">{{ c.field }}</span>: <s class="text-ink-subtle">{{ show(c.before) }}</s> → {{ show(c.after) }}
        </li>
      </ul>
    </li>
  </ol>
</template>
