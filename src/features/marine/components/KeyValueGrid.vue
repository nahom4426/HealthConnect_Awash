<script setup>
// Label and value summary for detail pages. Empty values show an em dash.
// items: [{ label, value, to?, wide? }]; a named slot `value-<label>` overrides one value.
defineProps({
  items: { type: Array, required: true },
  cols: { type: Number, default: 3 },
});
const empty = (v) => v === null || v === undefined || v === "";
</script>

<template>
  <dl :class="['grid gap-x-6 gap-y-4 sm:grid-cols-2', cols === 3 ? 'lg:grid-cols-3' : cols === 4 ? 'lg:grid-cols-4' : '']">
    <div v-for="item in items" :key="item.label" :class="['min-w-0', item.wide ? 'sm:col-span-2 lg:col-span-full' : '']">
      <dt class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">{{ item.label }}</dt>
      <dd class="mt-1 text-sm font-medium break-words text-ink">
        <slot :name="`value-${item.label}`" :item="item">
          <RouterLink v-if="item.to && !empty(item.value)" :to="item.to" class="font-medium text-primary hover:underline">{{ item.value }}</RouterLink>
          <span v-else :class="empty(item.value) ? 'font-normal text-ink-subtle' : ''">{{ empty(item.value) ? "—" : item.value }}</span>
        </slot>
      </dd>
    </div>
  </dl>
</template>
