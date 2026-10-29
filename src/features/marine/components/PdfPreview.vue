<script setup>
// Inline PDF: fetches the blob from a PDF endpoint, shows it in an iframe, with a Download button.
import { onBeforeUnmount, ref, watch } from "vue";
import Button from "@/components/Button.vue";
import PageState from "./PageState.vue";

const props = defineProps({
  fetcher: { type: Function, required: true }, // () => Promise<{ ok, data: Blob, error }>
  fileName: { type: String, default: "document.pdf" },
  /** Bump to refetch (for example when a pending document becomes ready) */
  version: { type: [String, Number], default: 0 },
});
const emit = defineEmits(["downloaded"]);

const url = ref("");
const loading = ref(true);
const error = ref(null);

async function load() {
  loading.value = true;
  error.value = null;
  const res = await props.fetcher();
  loading.value = false;
  if (url.value) URL.revokeObjectURL(url.value);
  if (res.ok) url.value = URL.createObjectURL(res.data instanceof Blob ? res.data : new Blob([res.data], { type: "application/pdf" }));
  else error.value = res.error;
}
watch(() => props.version, load, { immediate: true });
onBeforeUnmount(() => url.value && URL.revokeObjectURL(url.value));

function download() {
  const a = document.createElement("a");
  a.href = url.value;
  a.download = props.fileName;
  a.click();
  emit("downloaded");
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex justify-end mb-2">
      <Button variant="outline" size="sm" :disabled="!url" @click="download">Download PDF</Button>
    </div>
    <div class="overflow-hidden flex-1 rounded-xl border border-line bg-surface-muted min-h-[32rem]">
      <PageState v-if="loading" kind="loading" />
      <PageState v-else-if="error" kind="error" :message="error.message" @retry="load" />
      <iframe v-else :src="url" title="Certificate PDF" class="w-full h-full min-h-[32rem]"></iframe>
    </div>
  </div>
</template>
