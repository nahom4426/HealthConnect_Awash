<script setup>
// A person's photo, or the male/female default picture when there's none (or it fails to load).
// Size, shape and border come from the class you pass in.
import { computed, ref, watch } from "vue";
import { genderAvatar, photoSrc } from "@/utils/avatar";

const props = defineProps({
  photo: { type: String, default: "" },
  gender: { type: String, default: "" },
  alt: { type: String, default: "" },
});

const failed = ref(false);
watch(
  () => props.photo,
  () => (failed.value = false)
);

const fallback = computed(() => genderAvatar(props.gender));
const src = computed(() => (!failed.value && photoSrc(props.photo)) || fallback.value);

function onError() {
  if (!failed.value) failed.value = true;
}
</script>

<template>
  <img :src="src" :alt="alt" class="object-cover bg-surface-muted" loading="lazy" @error="onError" />
</template>
