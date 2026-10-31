<!-- ProcessClaimDetail.vue - Updated with improved institution name handling -->
<script setup>
import DefaultPage from '@/components/DefaultPage.vue';
import { usePagination } from "@/composables/usePagination";
import { getRequestedClaimByBatchDetail } from '../../api/claimApi';
import Table from '@/components/Table.vue';
import { useRoute, useRouter } from 'vue-router';
import { PaymentStatus } from '@/types/interface';
import { formatCurrency, secondDateFormat } from '@/utils/utils';
import Button from '@/components/Button.vue';
import BatchServicesReview from '../../components/BatchServicesReview.vue';
import { ref, onMounted, computed } from 'vue';
import { openModal } from '@customizer/modal-x';
import { useClaimByInstitutionBatch } from '../../store/claimByInstitutionBatchStore';
import ProcessProvidedItemsMdl from '../../components/modals/ProcessProvidedItems.mdl.vue';

const router = useRouter();
const route = useRoute();

// Get institution name from multiple sources with priority
const institutionName = computed(() => {
  // 1. Try to get from route state (passed via router.push or RouterLink)
  if (route.state?.institutionName) {
    return route.state.institutionName;
  }
  
  // 2. Try to get from query params
  if (route.query.institutionName) {
    return route.query.institutionName;
  }
  
  // 3. Try to get from the first claim in the store
  const firstClaim = store.claims?.[0];
  if (firstClaim?.institutionName) {
    return firstClaim.institutionName;
  }
  
  // 4. Try to get from route params (if institution name is in the URL)
  if (route.params.institutionName) {
    return route.params.institutionName;
  }
  
  // 5. Fallback to N/A
  return 'N/A';
});

const batchCode = route.params.batchCode;
const claimUuid = route.params.claimUuid;

const store = useClaimByInstitutionBatch();

const pagination = usePagination({
  store,
  auto: true,
  reset: true,
  perPage: 1000,
  cb: (data) => {
    const query = { ...data, limit: 1000 };
    if (query.search === "" || query.search == null) delete query.search;
    return getRequestedClaimByBatchDetail(query, claimUuid);
  },
});

onMounted(() => {
  if (!store.claims?.length) pagination.send();
});

const checked = ref([]);

const canProcessWholeClaim = computed(() => {
  const rows = store.claims || [];
  if (!rows.length) return false;
  return rows.every((r) => (r?.serviceClaimStatus || '').toUpperCase() !== 'PENDING');
});

function batchProcessed() {
  if (!checked.value.length) return;

  openModal('ProcessSelectedClaim', { 
    title: 'Process Selected Claims',
    claimUuid,
    selectedUuids: checked.value.slice(),
    store,
    onSuccess: () => {
      pagination.send();
      checked.value = [];
    }
  });
}

function openProcessWholeClaim() {
  openModal('ProcessClaim', { 
    title: 'Process Claim', 
    batchCode,
    claimUuid,
    onSuccess: () => {
      pagination.send();
    }
  });
}

const showItemsModal = ref(false);
const modalRow = ref(null);
const modalItems = ref([]);
const modalTitle = ref('Provided Items');

function openItemsModal(row) {
  modalRow.value = row;
  modalItems.value = row?.providedItemResponses || [];
  modalTitle.value = `Provided Items — ${row?.insuredName || row?.institutionName || ''}`;
  showItemsModal.value = true;
}

function getStatusStyle(status) {
  const base = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm";

  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return `${base} bg-success-soft text-success-strong border border-success/20`;
    case "PENDING":
      return `${base} bg-warning-soft text-warning-strong border border-warning/20`;
    case "PROCESSED":
      return `${base} bg-purple-50 text-purple-700 border border-purple-200`;
    case "VERIFIED":
      return `${base} bg-primary/5 text-primary-hover border border-primary/20`;
    case "APPROVED":
      return `${base} bg-sky-50 text-sky-700 border border-sky-200`;
    case "REJECTED":
      return `${base} bg-error-soft text-error-strong border border-error/20`;
    case "COMPLETED":
      return `${base} bg-primary/5 text-primary-hover border border-primary/20`;
    default:
      return `${base} bg-surface-muted text-ink-muted border border-line`;
  }
}

function getStatusIcon(status) {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "✓";
    case "PENDING":
      return "⏳";
    case "PROCESSED":
      return "🔄";
    case "VERIFIED":
      return "✅";
    case "APPROVED":
      return "⭐";
    case "REJECTED":
      return "❌";
    case "COMPLETED":
      return "🎯";
    default:
      return "●";
  }
}

function getInitials(name) {
  if (!name || name === 'N/A') return 'I';
  return name.charAt(0).toUpperCase();
}

function getStatusBadge(status) {
  return `${getStatusIcon(status)} ${status || 'Unknown'}`;
}

// Log for debugging
</script>

<template>
  <DefaultPage :hideSearch="true">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              {{ getInitials(institutionName) }}
            </div>
            <div>
              <h1 class="text-xl font-bold text-ink">{{ institutionName }}</h1>
              <p class="text-sm text-ink-subtle">Process Claim Details</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 bg-surface-muted rounded-lg border border-line">
            <span class="text-xs font-medium text-ink-muted">Batch:</span>
            <span class="text-xs font-mono text-ink">{{ batchCode || 'N/A' }}</span>
          </div>
        </div>
      </div>
    </template>

    <BatchServicesReview
      v-model="checked"
      :rows="store.claims || []"
      :pending="pagination.pending.value"
      action-label="Process Claim"
      :can-run-action="canProcessWholeClaim"
      :blocking-statuses="['PENDING']"
      @view-items="openItemsModal"
      @bulk="batchProcessed"
      @action="openProcessWholeClaim"
    />

    <ProcessProvidedItemsMdl
      v-if="showItemsModal"
      :row="modalRow"
      :items="modalItems"
      :title="modalTitle"
      @close="showItemsModal = false"
    />
  </DefaultPage>
</template>

