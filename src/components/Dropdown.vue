<script setup lang="ts">
import {
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  watch,
  type PropType,
} from "vue";

const props = defineProps({
  event: {
    type: String as PropType<keyof GlobalEventHandlersEventMap>,
    default: "click",
  },
  open: {
    type: Boolean,
    default: false,
  },
  position: {
    type: String, // "left-bototm" | "right-bottom">,
    default: "left-bottom",
  },
});

const dropdownWrapper = ref<HTMLElement>();
const openDropdown = ref(props.open);

function setRef(el: any) {
  dropdownWrapper.value = el;
}

function closeDropdown() {
  openDropdown.value = false;
}

function onWindowFocus(ev: FocusEvent) {
  if (ev.target != dropdownWrapper.value) closeDropdown();
}

function onKeydown(ev: KeyboardEvent) {
  if (ev.key == "Escape") closeDropdown();
}

onMounted(() => {
  window.addEventListener("focus", onWindowFocus);
  document.addEventListener(props.event, closeDropdown);
  document.addEventListener("keydown", onKeydown);
});

// Previously these listeners were never removed and accumulated per mount
onBeforeUnmount(() => {
  window.removeEventListener("focus", onWindowFocus);
  document.removeEventListener(props.event, closeDropdown);
  document.removeEventListener("keydown", onKeydown);
});

function toggle(value?: boolean) {
  openDropdown.value = value ?? !openDropdown.value;
}

onMounted(() => {
  dropdownWrapper.value?.classList.add("__dropdown-wrapper", props.position);
});

function showHide() {
  if (!dropdownWrapper.value) return;
  const height = [...dropdownWrapper.value.children].reduce(
    (sum, el) => el.clientHeight + sum,
    0
  );

  if (!openDropdown.value) {
    dropdownWrapper.value.style.setProperty("display", "none");
    dropdownWrapper.value.style.height = `${height}px`;
  } else {
    dropdownWrapper.value.style.removeProperty("display");
  }
}

onMounted(showHide);
watch(openDropdown, showHide);

watch(
  props,
  () => {
    if (props.open != openDropdown.value) {
      openDropdown.value = props.open;
    }
  },
  { immediate: true }
);
</script>
<template>
  <div @click.prevent.stop="() => {}" class="relative z-10 focus-within:z-50">
    <slot :toggle="toggle" :setRef="setRef" />
  </div>
</template>

<style>
.__dropdown-wrapper {
  top: 125%;
  position: absolute;
  z-index: 100;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-auto-rows: max-content;
}

.right-bottom {
  right: 0;
  bottom: 0;
}

.left-bottom {
  left: 0;
  bottom: 0;
}
</style>
