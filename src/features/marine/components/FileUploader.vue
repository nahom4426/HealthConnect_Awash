<script setup>
// Drag-and-drop document upload (plan section 3, FE-36): PDF, JPG or PNG up to 20 MB each, a
// progress bar per file, and a document kind dropdown unless the caller fixes the kind.
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { fileError, formatSize } from "../utils/files";
import { useId } from "../utils/useId";

const props = defineProps({
  /** (file, kind, onProgress) => Promise<{ ok, error? }> */
  upload: { type: Function, required: true },
  kinds: { type: Array, default: () => [] }, // [{ value, label }]
  kind: { type: String, default: "" }, // fixed kind: hides the dropdown
  multiple: { type: Boolean, default: true },
  accept: { type: String, default: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" },
  label: { type: String, default: "" },
});
const emit = defineEmits(["uploaded"]);

const { t } = useI18n();
const id = useId("up");
const over = ref(false);
const chosenKind = ref(props.kind || props.kinds[0]?.value || "OTHER");
const items = ref([]); // { name, size, progress, error, done }

async function handle(files) {
  for (const file of Array.from(files)) {
    const item = { name: file.name, size: file.size, progress: 0, error: fileError(file), done: false };
    items.value.push(item);
    const row = items.value[items.value.length - 1];
    if (row.error) continue;
    const res = await props.upload(file, props.kind || chosenKind.value, (e) => {
      if (e.total) row.progress = Math.round((e.loaded / e.total) * 100);
    });
    row.progress = 100;
    if (res.ok) {
      row.done = true;
      emit("uploaded", res.data);
    } else row.error = res.error.fields?.[0]?.message ?? res.error.message;
  }
}
function onDrop(e) {
  over.value = false;
  handle(e.dataTransfer.files);
}
</script>

<template>
  <div class="grid gap-2">
    <label v-if="!kind && kinds.length" class="flex gap-2 items-center text-sm text-ink">
      {{ t("upload.kind") }}
      <select v-model="chosenKind" class="px-2 h-9 rounded-lg border border-line bg-surface">
        <option v-for="k in kinds" :key="k.value" :value="k.value">{{ k.label }}</option>
      </select>
    </label>
    <label
      :for="id"
      :class="['flex flex-col gap-1 items-center justify-center p-5 text-center rounded-xl border-2 border-dashed cursor-pointer', over ? 'border-primary bg-primary/5' : 'border-line hover:border-line-strong']"
      @dragover.prevent="over = true"
      @dragleave="over = false"
      @drop.prevent="onDrop"
    >
      <svg class="w-6 h-6 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
      <span class="text-sm font-medium text-ink">{{ label || t("upload.drop") }}</span>
      <span class="text-xs text-ink-subtle">{{ t("upload.rules") }}</span>
      <input :id="id" type="file" class="sr-only" :multiple="multiple" :accept="accept" @change="handle($event.target.files); $event.target.value = ''" />
    </label>
    <ul v-if="items.length" class="space-y-1.5" aria-live="polite">
      <li v-for="(it, i) in items" :key="i" class="text-sm">
        <div class="flex gap-2 justify-between">
          <span class="truncate text-ink">{{ it.name }} <span class="text-xs text-ink-subtle">{{ formatSize(it.size) }}</span></span>
          <span :class="['text-xs', it.error ? 'text-error' : it.done ? 'text-success-strong' : 'text-ink-subtle']">{{ it.error ? t("upload.failed") : it.done ? t("upload.uploaded") : `${it.progress}%` }}</span>
        </div>
        <div v-if="!it.error" class="overflow-hidden mt-1 h-1 rounded-full bg-surface-raised"><div class="h-full bg-primary" :style="{ width: `${it.done ? 100 : it.progress}%` }"></div></div>
        <p v-else class="text-xs text-error">{{ it.error }}</p>
      </li>
    </ul>
  </div>
</template>
