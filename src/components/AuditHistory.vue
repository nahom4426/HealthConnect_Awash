<script setup>
// Compact audit timeline for one record. Renders nothing for users without audit.read
// (and stays silent if the service still answers 403).
import { computed, ref, watch } from "vue";
import {
  canReadAudit,
  formatAuditAmount,
  formatAuditTime,
  humanizeAction,
  searchAuditEvents,
} from "@/features/shared/admin/audit/Api/AuditApi";

const props = defineProps({
  module: { type: String, required: true },
  entityUuid: { type: String, default: "" },
  limit: { type: Number, default: 100 },
  title: { type: String, default: "Audit history" },
});

const allowed = ref(canReadAudit());
const events = ref([]);
const pending = ref(false);
const error = ref("");

function load() {
  if (!allowed.value || !props.entityUuid) {
    events.value = [];
    return;
  }
  pending.value = true;
  error.value = "";
  searchAuditEvents(props.module, { entityUuid: props.entityUuid, page: 1, limit: props.limit }).then((res) => {
    pending.value = false;
    if (res.success) {
      const list = Array.isArray(res.data?.content) ? res.data.content : [];
      // Oldest first reads as a story; seq is the service-wide order
      events.value = [...list].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    } else if (res.status === 403) {
      allowed.value = false;
    } else {
      error.value = res.error;
    }
  });
}

watch(() => [props.module, props.entityUuid], load, { immediate: true });

const visible = computed(() => allowed.value && !!props.entityUuid);
defineExpose({ reload: load });
</script>

<template>
  <section v-if="visible" class="p-4 bg-white rounded-xl border border-line">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-sm font-bold tracking-wide uppercase text-ink">{{ title }}</h3>
      <button type="button" class="text-xs font-medium text-primary hover:underline" :disabled="pending" @click="load">
        {{ pending ? "Loading…" : "Refresh" }}
      </button>
    </div>

    <p v-if="error" class="text-xs text-error-strong">{{ error }}</p>
    <p v-else-if="!pending && !events.length" class="text-xs text-ink-subtle">No recorded events yet.</p>

    <ol v-else class="relative ml-2 border-l border-line">
      <li v-for="e in events" :key="e.seq ?? e.eventUuid" class="pb-3 pl-4 last:pb-0">
        <span class="absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full bg-primary"></span>
        <div class="flex flex-wrap gap-x-2 gap-y-0.5 items-baseline text-sm">
          <span class="font-semibold text-ink">{{ humanizeAction(e.action) }}</span>
          <span v-if="e.fromStatus || e.toStatus" class="text-xs text-ink-muted">
            {{ e.fromStatus || "—" }} → {{ e.toStatus || "—" }}
          </span>
          <span v-if="e.amount != null" class="font-mono text-xs text-ink">ETB {{ formatAuditAmount(e.amount) }}</span>
          <span
            v-if="e.source === 'LISTENER'"
            class="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-warning-soft text-warning-strong"
            title="Recorded automatically from a status change"
          >
            auto
          </span>
        </div>
        <div class="text-xs text-ink-subtle">
          {{ formatAuditTime(e.occurredAt) }} · {{ e.actorName || e.actorUuid || "System" }}<span v-if="e.actorType"> ({{ e.actorType }})</span>
        </div>
        <div v-if="e.reason" class="mt-0.5 text-xs text-ink-muted">“{{ e.reason }}”</div>
      </li>
    </ol>
  </section>
</template>
