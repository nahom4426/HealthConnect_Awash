<script setup>
import icons from "@/utils/icons";

const props = defineProps({
  cells: { type: Object, default: () => ({}) },
  rowData: { type: Array, required: true, default: () => [] },
  rowKeys: { type: Array, required: true, default: () => [] },
  headKeys: { type: Array, required: false, default: () => [] },
  isMobile: { type: Boolean, default: false },
});

function call(name, row) {
  const fn = props.cells?.[name];
  if (typeof fn === "function") fn(row);
}

function statusClass(status) {
  return status === "ACTIVE"
    ? "bg-success-soft text-success-strong"
    : "bg-error-soft text-error-strong";
}
</script>

<template>
  <template v-if="!isMobile">
    <tr
      v-for="(row, idx) in rowData.filter((r) => r !== null)"
      :key="row?.branchUuid || idx"
      class="bg-white border-b transition-colors duration-150 ease-in-out hover:bg-surface-muted"
    >
      <td class="p-4 font-medium text-ink-subtle">{{ idx + 1 }}</td>
      <td class="px-4 py-4 font-mono text-sm text-ink">{{ row.code }}</td>
      <td class="px-4 py-4">
        <div class="flex gap-2 items-center">
          <span class="font-semibold text-ink">{{ row.name }}</span>
          <span
            v-if="row.headOffice"
            class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary-hover"
          >
            Head Office
          </span>
        </div>
      </td>
      <td class="px-4 py-4 text-sm text-ink-muted">{{ row.region || "—" }}</td>
      <td class="px-4 py-4 text-sm text-ink-muted">{{ row.address || "—" }}</td>
      <td class="px-4 py-4 text-sm text-ink-muted">{{ row.phone || "—" }}</td>
      <td class="px-4 py-4">
        <span
          class="inline-flex justify-center items-center min-w-[80px] px-3 py-1 rounded text-sm font-semibold"
          :class="statusClass(row.status)"
        >
          {{ row.status }}
        </span>
      </td>
      <td class="px-4 py-4">
        <div class="flex flex-wrap gap-2 items-center">
          <button
            @click.stop.prevent="call('onEdit', row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold rounded-xl border transition-all duration-200 text-primary bg-primary/5 border-primary/20 hover:bg-primary/10 hover:shadow-sm"
          >
            <i v-html="icons.edit" class="text-primary" />
            <span>Edit</span>
          </button>
          <button
            v-if="row.status !== 'ACTIVE'"
            @click.stop.prevent="call('onActivate', row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold rounded-xl border transition-all duration-200 text-success bg-success-soft border-success/20 hover:shadow-sm"
          >
            <i v-html="icons.activate" class="text-success" />
            <span>Activate</span>
          </button>
          <button
            v-else-if="!row.headOffice"
            @click.stop.prevent="call('onDeactivate', row)"
            class="flex gap-2 items-center px-3 py-1.5 text-sm font-semibold rounded-xl border transition-all duration-200 text-error bg-error-soft border-error/20 hover:shadow-sm"
          >
            <i v-html="icons.deactivate" class="text-error" />
            <span>Deactivate</span>
          </button>
        </div>
      </td>
    </tr>
  </template>

  <template v-else>
    <div
      v-for="(row, idx) in rowData.filter((r) => r !== null)"
      :key="row?.branchUuid || idx"
      class="p-3 mx-1 mb-2 bg-white rounded-lg border shadow-sm border-line"
    >
      <div class="flex justify-between items-start mb-2">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold truncate text-ink">{{ row.name }}</h3>
          <p class="font-mono text-xs text-ink-subtle">{{ row.code }}</p>
        </div>
        <span class="px-2 py-0.5 text-xs font-semibold rounded" :class="statusClass(row.status)">
          {{ row.status }}
        </span>
      </div>
      <p class="mb-2 text-xs text-ink-muted">
        {{ [row.region, row.address, row.phone].filter(Boolean).join(" · ") || "—" }}
      </p>
      <div class="flex gap-1.5 pt-2 border-t border-line">
        <button
          @click.stop.prevent="call('onEdit', row)"
          class="flex-1 px-3 py-2 text-xs font-medium rounded-md border text-primary bg-primary/5 border-primary/20"
        >
          Edit
        </button>
        <button
          v-if="row.status !== 'ACTIVE'"
          @click.stop.prevent="call('onActivate', row)"
          class="flex-1 px-3 py-2 text-xs font-medium rounded-md border text-success bg-success-soft border-success/20"
        >
          Activate
        </button>
        <button
          v-else-if="!row.headOffice"
          @click.stop.prevent="call('onDeactivate', row)"
          class="flex-1 px-3 py-2 text-xs font-medium rounded-md border text-error bg-error-soft border-error/20"
        >
          Deactivate
        </button>
      </div>
    </div>
  </template>
</template>
