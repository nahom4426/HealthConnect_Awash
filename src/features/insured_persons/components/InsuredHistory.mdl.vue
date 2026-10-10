<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import Spinner from "@/components/Spinner.vue";
import { closeModal } from "@customizer/modal-x";
import { computed, onMounted, ref, watch } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { toasted } from "@/utils/utils";
import { getInsuredServiceProvidedHistory } from "../api/insuredPersonsApi";

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

const apiRequest = useApiRequest();

const pending = ref(false);
const error = ref('');
const rows = ref([]);

const itemSearch = ref("");

const filteredRows = computed(() => {
  const q = String(itemSearch.value || "").trim().toLowerCase();
  if (!q) return rows.value || [];

  return (rows.value || []).filter((row) => {
    const items = Array.isArray(row?.providedItemResponses) ? row.providedItemResponses : [];
    return items.some((it) => {
      const name = String(it?.itemName || "").toLowerCase();
      const code = String(it?.itemCode || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  });
});

const matchedItemsCount = computed(() => {
  const q = String(itemSearch.value || "").trim().toLowerCase();
  if (!q) return 0;

  return (filteredRows.value || []).reduce((acc, row) => {
    const items = Array.isArray(row?.providedItemResponses) ? row.providedItemResponses : [];
    const matches = items.filter((it) => {
      const name = String(it?.itemName || "").toLowerCase();
      const code = String(it?.itemCode || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    }).length;
    return acc + matches;
  }, 0);
});

function splitHighlight(text, query) {
  const source = String(text ?? "");
  const q = String(query ?? "").trim();
  if (!q) return [{ text: source, match: false }];

  const lowerSource = source.toLowerCase();
  const lowerQ = q.toLowerCase();

  const parts = [];
  let i = 0;
  while (i < source.length) {
    const idx = lowerSource.indexOf(lowerQ, i);
    if (idx === -1) {
      parts.push({ text: source.slice(i), match: false });
      break;
    }
    if (idx > i) parts.push({ text: source.slice(i, idx), match: false });
    parts.push({ text: source.slice(idx, idx + q.length), match: true });
    i = idx + q.length;
  }
  return parts.filter((p) => p.text);
}

function rowHasItemMatch(row) {
  const q = String(itemSearch.value || "").trim().toLowerCase();
  if (!q) return false;
  const items = Array.isArray(row?.providedItemResponses) ? row.providedItemResponses : [];
  return items.some((it) => {
    const name = String(it?.itemName || "").toLowerCase();
    const code = String(it?.itemCode || "").toLowerCase();
    return name.includes(q) || code.includes(q);
  });
}

const expandedRows = ref(new Set());

function toggleExpanded(row) {
  const id = row?.serviceProvidedUuid;
  if (!id) return;
  if (expandedRows.value.has(id)) expandedRows.value.delete(id);
  else expandedRows.value.add(id);
}

function isExpanded(row) {
  const id = row?.serviceProvidedUuid;
  if (!id) return false;
  return expandedRows.value.has(id);
}

function formatDate(value) {
  if (!value) return "N/A";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch (_) {
    return String(value);
  }
}

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "N/A";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ETB",
      maximumFractionDigits: 2,
    }).format(num);
  } catch (_) {
    return `${num.toFixed(2)} ETB`;
  }
}

function getStatusStyle(status) {
  const s = String(status || "").toUpperCase();
  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold";
  switch (s) {
    case "PAID":
    case "APPROVED":
    case "ACTIVE":
      return `${base} bg-success-soft text-success-strong`;
    case "PENDING":
    case "SUBMITTED":
      return `${base} bg-warning-soft text-warning-strong`;
    case "REJECTED":
    case "CANCELLED":
    case "DECLINED":
      return `${base} bg-error-soft text-error-strong`;
    default:
      return `${base} bg-surface-muted text-ink-muted`;
  }
}

function getItemsPreview(items, max = 10) {
  const list = Array.isArray(items) ? items : [];
  const names = list
    .map((it) => (it?.itemName || it?.itemCode || "").trim())
    .filter(Boolean);

  const shown = names.slice(0, max);
  const remaining = Math.max(0, names.length - shown.length);
  return { shown, remaining };
}
  
const page = ref(1);
const limit = ref(25);
const totalPages = ref(1);
const totalItems = ref(0);

const insuredUuid = computed(() => props.data?.insuredUuid || null);
const dependantUuid = computed(() => props.data?.dependantUuid || null);
const contractUuid = computed(() => props.data?.contractUuid || null);
const institutionUuid = computed(() => props.data?.institutionUuid || null);

function normalizeResponse(payload) {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return { content: data, totalPages: 1, totalItems: data.length };
  }

  const content = data?.content || data?.items || data?.data || [];
  const tp = Number(data?.totalPages || data?.pages || 1);
  const ti = Number(data?.totalElements || data?.totalItems || data?.total || content?.length || 0);

  return {
    content: Array.isArray(content) ? content : [],
    totalPages: Number.isFinite(tp) && tp > 0 ? tp : 1,
    totalItems: Number.isFinite(ti) && ti >= 0 ? ti : 0,
  };
}

function fetchHistory() {
  if (!insuredUuid.value && !dependantUuid.value) {
    error.value = 'Missing insuredUuid/dependantUuid';
    return;
  }

  if (!institutionUuid.value) {
    error.value = 'Missing institutionUuid';
    return;
  }

  pending.value = true;
  error.value = '';

  apiRequest.send(
    () => getInsuredServiceProvidedHistory({
      insuredUuid: insuredUuid.value,
      dependantUuid: dependantUuid.value,
      institutionUuid: institutionUuid.value,
      page: Math.max(0, Number(page.value) - 1),
      limit: limit.value,
    }),
    (res) => {
      pending.value = false;

      if (!res?.success) {
        error.value = res?.error || 'Failed to load history';
        toasted(false, '', error.value);
        rows.value = [];
        totalPages.value = 1;
        totalItems.value = 0;
        return;
      }

      const normalized = normalizeResponse(res?.data);
      rows.value = normalized.content;
      totalPages.value = normalized.totalPages;
      totalItems.value = normalized.totalItems;
    }
  );
}

function nextPage() {
  if (page.value >= totalPages.value) return;
  page.value += 1;
}

function prevPage() {
  if (page.value <= 1) return;
  page.value -= 1;
}

watch([page, limit], () => {
  fetchHistory();
});

onMounted(() => {
  fetchHistory();
});
</script>

<template>
  <ModalParent>
    <NewFormParent
      size="xl"
      title="Insured History"
      subtitle="Service provided history for the selected insured member."
    >
      <div class="bg-white rounded-lg">
        <div v-if="error" class="p-4 mb-4 text-sm text-error-strong bg-error-soft rounded-lg">
          {{ error }}
        </div>

        <div class="flex flex-wrap gap-3 justify-between items-center p-4 mb-4 bg-surface-muted rounded-lg border">
          <div class="flex flex-col gap-2">
            <input
              v-model="itemSearch"
              type="text"
              class="px-3 py-2 w-72 max-w-full text-sm bg-white rounded-lg border border-line-strong focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search by item name..."
            />

            <div v-if="itemSearch" class="text-xs text-ink-muted">
              Matched services: {{ filteredRows.length }}
              <span v-if="matchedItemsCount">• Matched items: {{ matchedItemsCount }}</span>
            </div>
          </div>

          <div class="flex gap-2 items-center">
            <Button
              size="sm"
              class="text-ink-muted border border-line-strong hover:bg-surface-muted"
              :disabled="pending || page <= 1"
              @click="prevPage"
            >
              Prev
            </Button>
            <div class="text-sm text-ink-muted">
              Page {{ page }} / {{ totalPages }} ({{ totalItems }} items)
            </div>
            <Button
              size="sm"
              class="text-ink-muted border border-line-strong hover:bg-surface-muted"
              :disabled="pending || page >= totalPages"
              @click="nextPage"
            >
              Next
            </Button>
          </div>
        </div>

        <div v-if="pending" class="flex justify-center items-center p-8">
          <Spinner />
        </div>

        <div v-else class="overflow-hidden rounded-xl border border-line shadow-sm">
          <div class="hidden overflow-x-auto lg:block">
            <table class="min-w-full bg-white">
              <thead class="bg-gradient-to-r from-surface-muted to-surface-muted border-b border-line">
                <tr>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase">#</th>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase">Provider / Institution</th>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase">Member</th>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase">Provided Date</th>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase">Items</th>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase">Amount</th>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase">Status</th>
                  <th class="px-4 py-4 text-xs font-semibold tracking-wider text-left text-ink-muted uppercase"> </th>
                </tr>
              </thead>

              <tbody class="divide-y divide-line">
                <template v-if="filteredRows && filteredRows.length">
                  <template v-for="(row, idx) in filteredRows" :key="row?.serviceProvidedUuid || idx">
                    <tr
                      class="bg-white transition-colors hover:bg-surface-muted"
                      :class="itemSearch && rowHasItemMatch(row) ? 'ring-1 ring-warning/20 bg-warning-soft/30' : ''"
                    >
                      <td class="px-4 py-4 text-sm font-medium text-ink-subtle">
                        {{ (page - 1) * limit + idx + 1 }}
                      </td>

                      <td class="px-4 py-4">
                        <div class="leading-tight">
                          <div class="font-semibold text-ink truncate">
                            {{ row?.providerName || 'N/A' }}
                          </div>
                          <div class="text-xs text-ink-subtle truncate">
                            {{ row?.institutionName || 'N/A' }}
                          </div>
                        </div>
                      </td>

                      <td class="px-4 py-4">
                        <div class="leading-tight">
                          <div class="font-semibold text-ink truncate">
                            {{ row?.dependantName || row?.insuredName || 'N/A' }}
                          </div>
                          <div class="text-xs text-ink-subtle truncate">
                            {{ row?.dependantUuid ? 'Dependent' : 'Insured' }}
                          </div>
                        </div>
                      </td>

                      <td class="px-4 py-4 text-sm text-ink-muted">
                        {{ formatDate(row?.providedDate) }}
                      </td>

                      <td class="px-4 py-4">
                        <div class="text-sm font-semibold text-ink">
                          {{ Array.isArray(row?.providedItemResponses) ? row.providedItemResponses.length : 0 }} item(s)
                        </div>
                        <div v-if="row?.providedItemResponses && row.providedItemResponses.length" class="mt-1 space-y-0.5">
                          <div
                            v-for="(name, i) in getItemsPreview(row.providedItemResponses).shown"
                            :key="`${row?.serviceProvidedUuid || 'row'}-item-${i}`"
                            class="text-xs text-ink-subtle truncate"
                          >
                            <span v-for="(part, pi) in splitHighlight(name, itemSearch)" :key="pi">
                              <span
                                v-if="part.match"
                                class="px-1 font-semibold text-warning-strong rounded bg-warning/[0.12]"
                              >
                                {{ part.text }}
                              </span>
                              <span v-else>{{ part.text }}</span>
                            </span>
                          </div>
                          <div
                            v-if="getItemsPreview(row.providedItemResponses).remaining > 0"
                            class="text-xs text-ink-subtle"
                          >
                            +{{ getItemsPreview(row.providedItemResponses).remaining }} more
                          </div>
                        </div>
                      </td>

                      <td class="px-4 py-4 text-sm font-semibold text-ink">
                        {{ formatMoney(row?.amount) }}
                      </td>

                      <td class="px-4 py-4">
                        <span :class="getStatusStyle(row?.serviceClaimStatus)">
                          {{ row?.serviceClaimStatus || 'N/A' }}
                        </span>
                      </td>

                      <td class="px-4 py-4">
                        <button
                          class="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-ink-muted rounded-lg border border-line hover:bg-surface-muted"
                          @click="toggleExpanded(row)"
                          type="button"
                        >
                          {{ isExpanded(row) ? 'Hide' : 'View' }}
                        </button>
                      </td>
                    </tr>

                    <tr v-if="isExpanded(row)" class="bg-gradient-to-r from-primary/5 to-primary/5">
                      <td colspan="100%" class="px-6 py-5">
                        <div class="space-y-3">
                          <div class="flex justify-between items-center">
                            <div class="text-sm font-semibold text-ink">Provided Items</div>
                            <!-- <div class="text-xs text-ink-muted">
                              Ref: {{ row?.serviceProvidedUuid || 'N/A' }}
                            </div> -->
                          </div>

                          <div class="overflow-hidden bg-white rounded-lg border border-primary/10">
                            <table class="min-w-full">
                              <thead class="bg-primary/5 border-b border-primary/10">
                                <tr>
                                  <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-primary-hover uppercase">Code</th>
                                  <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-primary-hover uppercase">Name</th>
                                  <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-primary-hover uppercase">Qty</th>
                                  <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-primary-hover uppercase">Unit Price</th>
                                  <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-primary-hover uppercase">Total</th>
                                  <th class="px-4 py-3 text-xs font-semibold tracking-wider text-left text-primary-hover uppercase">Type</th>
                                </tr>
                              </thead>
                              <tbody class="divide-y divide-primary/5">
                                <tr
                                  v-for="(item, i) in (row?.providedItemResponses || [])"
                                  :key="item?.providedItemUuid || i"
                                  class="hover:bg-primary/[0.02]"
                                >
                                  <td class="px-4 py-3 text-sm font-medium text-ink">
                                    <span v-for="(part, pi) in splitHighlight(item?.itemCode || 'N/A', itemSearch)" :key="pi">
                                      <span
                                        v-if="part.match"
                                        class="px-1 font-semibold text-warning-strong rounded bg-warning/[0.12]"
                                      >
                                        {{ part.text }}
                                      </span>
                                      <span v-else>{{ part.text }}</span>
                                    </span>
                                  </td>
                                  <td class="px-4 py-3 text-sm text-ink">
                                    <span v-for="(part, pi) in splitHighlight(item?.itemName || 'N/A', itemSearch)" :key="pi">
                                      <span
                                        v-if="part.match"
                                        class="px-1 font-semibold text-warning-strong rounded bg-warning/[0.12]"
                                      >
                                        {{ part.text }}
                                      </span>
                                      <span v-else>{{ part.text }}</span>
                                    </span>
                                  </td>
                                  <td class="px-4 py-3 text-sm text-ink">
                                    {{ item?.quantity ?? 'N/A' }}
                                  </td>
                                  <td class="px-4 py-3 text-sm text-ink">
                                    {{ formatMoney(item?.unitPrice) }}
                                  </td>
                                  <td class="px-4 py-3 text-sm font-semibold text-ink">
                                    {{ formatMoney(item?.totalPrice) }}
                                  </td>
                                  <td class="px-4 py-3 text-sm text-ink">
                                    <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-ink-muted bg-surface-muted rounded-full">
                                      {{ item?.itemType || 'N/A' }}
                                    </span>
                                  </td>
                                </tr>

                                <tr v-if="!(row?.providedItemResponses && row.providedItemResponses.length)">
                                  <td colspan="100%" class="px-4 py-6 text-sm text-center text-ink-subtle">
                                    No items found for this service.
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </template>

                <tr v-else>
                  <td colspan="100%" class="py-10">
                    <div class="text-center">
                      <div class="text-sm font-semibold text-ink">
                        {{ itemSearch ? 'No Matches Found' : 'No History Found' }}
                      </div>
                      <div class="text-sm text-ink-subtle">
                        {{ itemSearch ? 'No services include that item.' : 'This insured member has no service provided records yet.' }}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div class="p-3 space-y-3 bg-surface-muted lg:hidden">
            <div
              v-for="(row, idx) in (filteredRows || [])"
              :key="row?.serviceProvidedUuid || idx"
              class="p-4 bg-white rounded-xl border border-line shadow-sm"
              :class="itemSearch && rowHasItemMatch(row) ? 'ring-1 ring-warning/20 bg-warning-soft/30' : ''"
            >
              <div class="flex gap-3 justify-between items-start">
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-ink truncate">
                    {{ row?.providerName || 'N/A' }}
                  </div>
                  <div class="text-xs text-ink-subtle truncate">
                    {{ row?.institutionName || 'N/A' }}
                  </div>
                </div>
                <span :class="getStatusStyle(row?.serviceClaimStatus)">
                  {{ row?.serviceClaimStatus || 'N/A' }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <div class="text-xs font-semibold text-ink-subtle uppercase">Member</div>
                  <div class="text-sm text-ink truncate">
                    {{ row?.dependantName || row?.insuredName || 'N/A' }}
                  </div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-ink-subtle uppercase">Provided Date</div>
                  <div class="text-sm text-ink">
                    {{ formatDate(row?.providedDate) }}
                  </div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-ink-subtle uppercase">Amount</div>
                  <div class="text-sm font-semibold text-ink">
                    {{ formatMoney(row?.amount) }}
                  </div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-ink-subtle uppercase">Items</div>
                  <div class="text-sm text-ink">
                    {{ Array.isArray(row?.providedItemResponses) ? row.providedItemResponses.length : 0 }}
                  </div>
                  <div v-if="row?.providedItemResponses && row.providedItemResponses.length" class="mt-1 space-y-0.5">
                    <div
                      v-for="(name, i) in getItemsPreview(row.providedItemResponses).shown"
                      :key="`${row?.serviceProvidedUuid || 'row'}-m-item-${i}`"
                      class="text-xs text-ink-subtle truncate"
                    >
                      <span v-for="(part, pi) in splitHighlight(name, itemSearch)" :key="pi">
                        <span
                          v-if="part.match"
                          class="px-1 font-semibold text-warning-strong rounded bg-warning/[0.12]"
                        >
                          {{ part.text }}
                        </span>
                        <span v-else>{{ part.text }}</span>
                      </span>
                    </div>
                    <div
                      v-if="getItemsPreview(row.providedItemResponses).remaining > 0"
                      class="text-xs text-ink-subtle"
                    >
                      +{{ getItemsPreview(row.providedItemResponses).remaining }} more
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4">
                <button
                  class="inline-flex justify-center items-center px-3 py-2 w-full text-sm font-semibold text-ink-muted rounded-lg border border-line hover:bg-surface-muted"
                  @click="toggleExpanded(row)"
                  type="button"
                >
                  {{ isExpanded(row) ? 'Hide details' : 'View details' }}
                </button>
              </div>

              <div v-if="isExpanded(row)" class="p-3 mt-4 bg-primary/5 rounded-lg border border-primary/10">
                <div class="mb-2 text-sm font-semibold text-ink">Provided Items</div>
                <div class="space-y-2">
                  <div
                    v-for="(item, i) in (row?.providedItemResponses || [])"
                    :key="item?.providedItemUuid || i"
                    class="p-3 bg-white rounded-lg border border-primary/10"
                  >
                    <div class="flex gap-3 justify-between">
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-ink truncate">
                          {{ item?.itemName || 'N/A' }}
                        </div>
                        <div class="text-xs text-ink-subtle truncate">
                          {{ item?.itemCode || 'N/A' }} • {{ item?.itemType || 'N/A' }}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-semibold text-ink">
                          {{ formatMoney(item?.totalPrice) }}
                        </div>
                        <div class="text-xs text-ink-subtle">
                          Qty: {{ item?.quantity ?? 'N/A' }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="!(row?.providedItemResponses && row.providedItemResponses.length)" class="text-sm text-ink-muted">
                    No items found for this service.
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!(filteredRows && filteredRows.length)" class="p-6 text-center bg-white rounded-xl border border-line shadow-sm">
              <div class="text-sm font-semibold text-ink">
                {{ itemSearch ? 'No Matches Found' : 'No History Found' }}
              </div>
              <div class="text-sm text-ink-subtle">
                {{ itemSearch ? 'No services include that item.' : 'This insured member has no service provided records yet.' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #bottom>
        <div class="flex gap-3 justify-end items-center p-4 w-full border-t">
          <Button
            size="md"
            class="text-ink-muted border border-line-strong hover:bg-surface-muted"
            @click="closeModal()"
          >
            Close
          </Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
