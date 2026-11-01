<script setup>
import { computed, reactive, ref } from "vue";
import { getAllBranches } from "@/features/shared/admin/branch/Api/BranchApi";
import {
  AUDIT_MODULES,
  canReadAudit,
  formatAuditAmount,
  formatAuditTime,
  humanizeAction,
  prettyDetail,
  searchAuditEvents,
  verifyAuditChain,
} from "../Api/AuditApi";

const PAGE_SIZE = 25;

const module = ref("health");
const filters = reactive({ entityUuid: "", actorUuid: "", action: "", branchUuid: "", from: "", to: "" });

const rows = ref([]);
const page = ref(1);
const totalPages = ref(0);
const totalElements = ref(0);
const pending = ref(false);
const error = ref("");
const forbidden = ref(!canReadAudit());
const expanded = ref(new Set());

const verifying = ref(false);
const verifyResult = ref(null);
const verifyError = ref("");

// Branch names for the dropdown and the table (directory lives in AuthService)
const branches = ref([]);
const branchName = computed(() =>
  Object.fromEntries(branches.value.map((b) => [b.branchUuid, b.name || b.code || b.branchUuid]))
);
getAllBranches(true).then((res) => {
  if (res?.success) branches.value = Array.isArray(res.data) ? res.data : res.data?.content || [];
});

function load(toPage = 1) {
  if (forbidden.value) return;
  pending.value = true;
  error.value = "";
  expanded.value = new Set();
  searchAuditEvents(module.value, { ...filters, page: toPage, limit: PAGE_SIZE }).then((res) => {
    pending.value = false;
    if (!res.success) {
      if (res.status === 403) forbidden.value = true;
      rows.value = [];
      totalPages.value = 0;
      totalElements.value = 0;
      error.value = res.error;
      return;
    }
    const data = res.data || {};
    rows.value = Array.isArray(data.content) ? data.content : [];
    page.value = toPage;
    totalPages.value = data.totalPages || 0;
    totalElements.value = data.totalElements ?? rows.value.length;
  });
}

function onModuleChange() {
  verifyResult.value = null;
  verifyError.value = "";
  load(1);
}

function resetFilters() {
  Object.assign(filters, { entityUuid: "", actorUuid: "", action: "", branchUuid: "", from: "", to: "" });
  load(1);
}

function toggle(row) {
  const key = row.seq ?? row.eventUuid;
  const next = new Set(expanded.value);
  next.has(key) ? next.delete(key) : next.add(key);
  expanded.value = next;
}
const isOpen = (row) => expanded.value.has(row.seq ?? row.eventUuid);

function verify() {
  verifying.value = true;
  verifyResult.value = null;
  verifyError.value = "";
  verifyAuditChain(module.value).then((res) => {
    verifying.value = false;
    if (res.success) verifyResult.value = res.data || {};
    else {
      if (res.status === 403) forbidden.value = true;
      verifyError.value = res.error;
    }
  });
}

const moduleLabel = computed(() => AUDIT_MODULES.find((m) => m.id === module.value)?.label || module.value);
const inputClass =
  "px-3 h-control text-sm bg-white rounded-lg border text-ink border-line-strong focus:ring-2 focus:ring-primary focus:border-primary";

load(1);
</script>

<template>
  <div class="flex flex-col gap-4 p-3 max-w-full card sm:p-5">
    <!-- No audit.read: say so plainly instead of an empty table -->
    <div
      v-if="forbidden"
      class="flex gap-3 items-start p-4 rounded-lg border bg-error-soft text-error-strong border-error-soft"
    >
      <svg class="flex-shrink-0 mt-0.5 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v.01M6 21h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4" />
      </svg>
      <div>
        <p class="font-semibold">You do not have access to the audit log.</p>
        <p class="text-sm">Reading the audit trail needs the <code>audit.read</code> privilege. Ask an administrator to grant it.</p>
      </div>
    </div>

    <template v-else>
      <!-- Module + verify -->
      <div class="flex flex-col gap-3 justify-between md:flex-row md:items-center">
        <div class="flex flex-wrap gap-3 items-center">
          <label class="text-sm font-medium text-ink-muted" for="audit-module">Module</label>
          <select id="audit-module" v-model="module" :class="inputClass" @change="onModuleChange">
            <option v-for="m in AUDIT_MODULES" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
          <span class="text-sm text-ink-subtle">{{ totalElements }} event{{ totalElements === 1 ? "" : "s" }}</span>
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <span
            v-if="verifyResult"
            class="inline-flex gap-2 items-center px-3 py-1 text-sm font-semibold rounded"
            :class="verifyResult.valid ? 'bg-success-soft text-success-strong' : 'bg-error-soft text-error-strong'"
          >
            <template v-if="verifyResult.valid">Chain valid · {{ verifyResult.checked }} checked</template>
            <template v-else>
              Chain broken at seq {{ verifyResult.firstBrokenSeq ?? "?" }} · {{ verifyResult.checked }} checked
              <span v-if="verifyResult.problem" class="font-normal">({{ verifyResult.problem }})</span>
            </template>
          </span>
          <span v-if="verifyError" class="text-sm text-error-strong">{{ verifyError }}</span>
          <button
            class="flex gap-2 justify-center items-center px-5 font-medium text-white rounded-lg transition-colors h-control bg-primary hover:bg-primary/90 disabled:opacity-60"
            :disabled="verifying"
            :title="`Re-compute the ${moduleLabel} hash chain`"
            @click="verify"
          >
            {{ verifying ? "Verifying…" : "Verify integrity" }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <form class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" @submit.prevent="load(1)">
        <input v-model.trim="filters.entityUuid" :class="inputClass" placeholder="Record UUID" aria-label="Record UUID" />
        <input v-model.trim="filters.actorUuid" :class="inputClass" placeholder="User UUID" aria-label="User UUID" />
        <input v-model.trim="filters.action" :class="inputClass" placeholder="Action (e.g. APPROVE)" aria-label="Action" />
        <select v-model="filters.branchUuid" :class="inputClass" aria-label="Branch">
          <option value="">All branches</option>
          <option v-for="b in branches" :key="b.branchUuid" :value="b.branchUuid">
            {{ b.name }}{{ b.code ? ` (${b.code})` : "" }}
          </option>
        </select>
        <label class="flex gap-2 items-center text-sm text-ink-muted">
          From <input v-model="filters.from" type="date" :class="inputClass" class="flex-1" />
        </label>
        <label class="flex gap-2 items-center text-sm text-ink-muted">
          To <input v-model="filters.to" type="date" :class="inputClass" class="flex-1" />
        </label>
        <div class="flex gap-2 lg:col-span-2">
          <button type="submit" class="px-5 font-medium text-white rounded-lg h-control bg-primary hover:bg-primary/90">Search</button>
          <button type="button" class="px-5 font-medium rounded-lg border h-control border-line-strong text-ink hover:bg-surface-muted" @click="resetFilters">
            Reset
          </button>
        </div>
      </form>

      <p v-if="error" class="text-sm text-error-strong">{{ error }}</p>

      <!-- Table -->
      <div class="overflow-x-auto rounded-lg border border-line">
        <table class="min-w-full text-sm text-left">
          <thead class="text-xs uppercase bg-surface-muted text-ink-muted">
            <tr>
              <th class="px-3 py-3 w-8"></th>
              <th class="px-3 py-3">Time</th>
              <th class="px-3 py-3">User</th>
              <th class="px-3 py-3">Action</th>
              <th class="px-3 py-3">Record</th>
              <th class="px-3 py-3">Status</th>
              <th class="px-3 py-3">Reason</th>
              <th class="px-3 py-3 text-right">Amount</th>
              <th class="px-3 py-3">Branch</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pending">
              <td colspan="9" class="px-3 py-6 text-center text-ink-subtle">Loading audit events…</td>
            </tr>
            <tr v-else-if="!rows.length">
              <td colspan="9" class="px-3 py-6 text-center text-ink-subtle">No audit events match these filters.</td>
            </tr>
            <template v-else>
            <template v-for="row in rows" :key="row.seq ?? row.eventUuid">
              <tr class="bg-white border-t cursor-pointer border-line hover:bg-surface-muted" @click="toggle(row)">
                <td class="px-3 py-3 text-ink-subtle">
                  <svg class="w-4 h-4 transition-transform" :class="isOpen(row) ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </td>
                <td class="px-3 py-3 whitespace-nowrap text-ink">{{ formatAuditTime(row.occurredAt) }}</td>
                <td class="px-3 py-3">
                  <div class="font-medium text-ink">{{ row.actorName || row.actorUuid || "System" }}</div>
                  <div v-if="row.actorType" class="text-xs text-ink-subtle">{{ row.actorType }}</div>
                </td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-1.5 items-center">
                    <span class="font-semibold text-ink">{{ humanizeAction(row.action) }}</span>
                    <span
                      v-if="row.source === 'LISTENER'"
                      class="px-2 py-0.5 text-xs font-medium rounded-full bg-warning-soft text-warning-strong"
                      title="Recorded automatically from a status change, not by an explicit service call"
                    >
                      auto
                    </span>
                  </div>
                </td>
                <td class="px-3 py-3">
                  <div class="text-ink">{{ row.entityType || "—" }}</div>
                  <div class="font-mono text-xs break-all text-ink-subtle">{{ row.entityUuid }}</div>
                </td>
                <td class="px-3 py-3 whitespace-nowrap text-ink-muted">
                  <template v-if="row.fromStatus || row.toStatus">{{ row.fromStatus || "—" }} → {{ row.toStatus || "—" }}</template>
                  <template v-else>—</template>
                </td>
                <td class="px-3 py-3 max-w-xs text-ink-muted">{{ row.reason || "—" }}</td>
                <td class="px-3 py-3 font-mono text-right whitespace-nowrap text-ink">{{ formatAuditAmount(row.amount) }}</td>
                <td class="px-3 py-3 text-ink-muted">{{ row.branchUuid ? branchName[row.branchUuid] || row.branchUuid : "—" }}</td>
              </tr>
              <tr v-if="isOpen(row)" class="border-t border-line bg-surface-muted">
                <td></td>
                <td colspan="8" class="px-3 py-4">
                  <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-xs md:grid-cols-2">
                    <div><dt class="inline text-ink-subtle">Seq: </dt><dd class="inline font-mono text-ink">{{ row.seq }}</dd></div>
                    <div><dt class="inline text-ink-subtle">Event: </dt><dd class="inline font-mono break-all text-ink">{{ row.eventUuid }}</dd></div>
                    <div><dt class="inline text-ink-subtle">Service: </dt><dd class="inline text-ink">{{ row.service || "—" }}</dd></div>
                    <div><dt class="inline text-ink-subtle">Source: </dt><dd class="inline text-ink">{{ row.source || "—" }}</dd></div>
                    <div><dt class="inline text-ink-subtle">User UUID: </dt><dd class="inline font-mono break-all text-ink">{{ row.actorUuid || "—" }}</dd></div>
                    <div><dt class="inline text-ink-subtle">Correlation id: </dt><dd class="inline font-mono break-all text-ink">{{ row.correlationId || "—" }}</dd></div>
                    <div><dt class="inline text-ink-subtle">Client IP: </dt><dd class="inline font-mono text-ink">{{ row.clientIp || "—" }}</dd></div>
                    <div class="md:col-span-2"><dt class="inline text-ink-subtle">Previous hash: </dt><dd class="inline font-mono break-all text-ink">{{ row.prevHash || "—" }}</dd></div>
                    <div class="md:col-span-2"><dt class="inline text-ink-subtle">Hash: </dt><dd class="inline font-mono break-all text-ink">{{ row.hash || "—" }}</dd></div>
                  </dl>
                  <div v-if="row.detail" class="mt-3">
                    <div class="mb-1 text-xs text-ink-subtle">Detail</div>
                    <pre class="overflow-x-auto p-3 max-h-80 font-mono text-xs bg-white rounded-lg border border-line text-ink">{{ prettyDetail(row.detail) }}</pre>
                  </div>
                </td>
              </tr>
            </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Pager -->
      <div v-if="totalPages > 1" class="flex gap-3 justify-end items-center text-sm">
        <button
          class="px-4 rounded-lg border h-control border-line-strong text-ink hover:bg-surface-muted disabled:opacity-50"
          :disabled="pending || page <= 1"
          @click="load(page - 1)"
        >
          Previous
        </button>
        <span class="text-ink-muted">Page {{ page }} of {{ totalPages }}</span>
        <button
          class="px-4 rounded-lg border h-control border-line-strong text-ink hover:bg-surface-muted disabled:opacity-50"
          :disabled="pending || page >= totalPages"
          @click="load(page + 1)"
        >
          Next
        </button>
      </div>
    </template>
  </div>
</template>
