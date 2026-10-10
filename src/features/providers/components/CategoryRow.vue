<script setup>
  import { defineProps } from 'vue';
  import { useToast } from '@/toast/store/toast';
  import { addNotEligibleCategory, removeNotEligibleCategory } from '../api/categoryApi';
  
  const props = defineProps({
    rowData: { type: Array, required: true },
    rowKeys: { type: Array, required: true },
    headKeys: { type: Array, required: true },
    currentPage: { type: Number, default: 1 },
    perPage: { type: Number, default: 25 },
    notEligibleByCategory: { type: Object, default: () => ({}) },
    contractUuid: { type: String, required: true },
    policyUuid: { type: String, required: true },
    onRefresh: { type: Function, default: () => {} },
  });
  
  const { addToast } = useToast();
  
  function isNotEligible(row) {
  if (!row?.categoryUuid) return false;
  const notEligibleItem = Object.values(props.notEligibleByCategory || {}).find(
    item => item.categoryUuid === row.categoryUuid
  );
  return !!notEligibleItem;
}
  
  function getStatusText(row) {
    const status = isNotEligible(row) ? 'Not Eligible' : 'Eligible';
    return status;
  }
  
  async function handleActivate(row) {
    // Activate means: remove NOT-eligible mark
    const rec = props.notEligibleByCategory?.[row.categoryUuid];
    const id = rec?.notEligibleCategoryUuid || rec?.id || rec?.uuid;
    if (!id) {
      addToast({ type: 'error', message: 'Missing notEligibleCategory ID' });
      return;
    }
    try {
      const res = await removeNotEligibleCategory(id);
      if (res?.success || res?.status === 200 || res?.status === 204) {
        addToast({ type: 'success', message: `Activated ${row.categoryName}` });
        props.onRefresh?.();
      } else {
        addToast({ type: 'error', message: res?.error || 'Failed to activate' });
      }
    } catch (e) {
      addToast({ type: 'error', message: e?.message || 'Failed to activate' });
    }
  }
  
  async function handleDeactivate(row) {
    try {
      const res = await addNotEligibleCategory({
        contractUuid: props.contractUuid,
        policyUuid: props.policyUuid,
        categoryUuid: row.categoryUuid,
      });
      if (res?.success || res?.status === 200 || res?.status === 201) {
        addToast({ type: 'success', message: `Deactivated ${row.categoryName}` });
        props.onRefresh?.();
      } else {
        addToast({ type: 'error', message: res?.error || 'Failed to deactivate' });
      }
    } catch (e) {
      addToast({ type: 'error', message: e?.message || 'Failed to deactivate' });
    }
  }
  </script>
  
  <template>
    <tr
      v-for="(row, idx) in rowData"
      :key="row.categoryUuid || idx"
      class="bg-white border-b hover:bg-surface-muted"
    >
      <!-- Index column -->
      <td class="p-4 font-medium text-ink-subtle">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>
  
      <!-- Dynamic columns based on rowKeys -->
      <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
        <span v-if="key === 'status'" class="px-2.5 py-1 text-xs font-medium rounded-full"
          :class="{
            'bg-error-soft text-error-strong': isNotEligible(row),
            'bg-success-soft text-success-strong': !isNotEligible(row),
          }"
        >
          {{ getStatusText(row) }}
        </span>
        <span v-else class="text-ink-muted">{{ row[key] }}</span>
      </td>
  
      <!-- Actions Column -->
      <td class="p-3">
        <div class="flex gap-2">
          <button
            v-if="isNotEligible(row)"
            class="px-3 py-1 text-sm text-white bg-success rounded hover:bg-success-strong"
            @click.prevent="handleActivate(row)"
          >
            Activate
          </button>
          <button
            v-else
            class="px-3 py-1 text-sm text-white bg-error rounded hover:bg-error-strong"
            @click.prevent="handleDeactivate(row)"
          >
            Deactivate
          </button>
        </div>
      </td>
    </tr>
  </template>