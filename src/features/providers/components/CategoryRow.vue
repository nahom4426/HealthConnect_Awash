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
    console.log(`[CategoryRow] Status for ${row.categoryName}:`, status);
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
    console.log('[CategoryRow] handleDeactivation called with row:', row);
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
      class="bg-white border-b hover:bg-gray-50"
    >
      <!-- Index column -->
      <td class="p-4 font-medium text-gray-500">{{ (props.currentPage - 1) * props.perPage + idx + 1 }}</td>
  
      <!-- Dynamic columns based on rowKeys -->
      <td class="p-3 py-4" v-for="key in rowKeys" :key="key">
        <span v-if="key === 'status'" class="px-2.5 py-1 text-xs font-medium rounded-full"
          :class="{
            'bg-red-100 text-red-800': isNotEligible(row),
            'bg-green-100 text-green-800': !isNotEligible(row),
          }"
        >
          {{ getStatusText(row) }}
        </span>
        <span v-else class="text-gray-700">{{ row[key] }}</span>
      </td>
  
      <!-- Actions Column -->
      <td class="p-3">
        <div class="flex gap-2">
          <button
            v-if="isNotEligible(row)"
            class="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
            @click.prevent="handleActivate(row)"
          >
            Activate
          </button>
          <button
            v-else
            class="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            @click.prevent="handleDeactivate(row)"
          >
            Deactivate
          </button>
        </div>
      </td>
    </tr>
  </template>