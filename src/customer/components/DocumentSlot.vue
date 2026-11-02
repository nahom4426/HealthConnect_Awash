<script setup>
import { computed, onBeforeUnmount } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  files: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:files']);

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const MAX_BYTES = 10 * 1024 * 1024;
const id = `d-${Math.random().toString(36).slice(2, 9)}`;
const tooBig = computed(() => props.files.find((f) => f.size > MAX_BYTES));

const urls = new Map();
function preview(file) {
  if (!file.type.startsWith('image/')) return null;
  if (!urls.has(file)) urls.set(file, URL.createObjectURL(file));
  return urls.get(file);
}
onBeforeUnmount(() => urls.forEach((u) => URL.revokeObjectURL(u)));

function add(event) {
  const picked = Array.from(event.target.files || []);
  event.target.value = '';
  emit('update:files', [...props.files, ...picked]);
}
function remove(i) {
  const next = props.files.slice();
  const [gone] = next.splice(i, 1);
  if (urls.has(gone)) { URL.revokeObjectURL(urls.get(gone)); urls.delete(gone); }
  emit('update:files', next);
}
</script>

<template>
  <div class="rounded-xl border p-4" :class="files.length ? 'border-success' : 'border-line'">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium">{{ label }}</p>
        <p class="text-xs" :class="files.length ? 'text-success-strong' : (required ? 'text-error-strong' : 'text-ink-subtle')">
          {{ files.length ? `${files.length} file${files.length === 1 ? '' : 's'} attached` : (required ? 'Required' : 'Optional') }}
        </p>
      </div>
      <label :for="id" class="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-muted">
        {{ files.length ? 'Add more' : 'Add file' }}
        <input :id="id" type="file" class="sr-only" :accept="ACCEPT" multiple @change="add" />
      </label>
    </div>
    <ul v-if="files.length" class="mt-3 flex flex-wrap gap-2">
      <li v-for="(f, i) in files" :key="f.name + i" class="relative">
        <img v-if="preview(f)" :src="preview(f)" :alt="f.name" class="h-16 w-16 rounded-lg object-cover" />
        <span v-else class="flex h-16 w-24 items-center justify-center truncate rounded-lg bg-surface-muted px-2 text-xs">{{ f.name }}</span>
        <button type="button" class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs text-white" :aria-label="`Remove ${f.name}`" @click="remove(i)">×</button>
      </li>
    </ul>
    <p v-if="tooBig" role="alert" class="mt-2 text-xs text-error-strong">{{ tooBig.name }} is larger than 10 MB.</p>
  </div>
</template>
