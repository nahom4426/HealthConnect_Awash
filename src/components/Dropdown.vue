<script setup lang="ts">
import {
  onMounted,
  onUpdated,
  ref,
  watch,
  watchEffect,
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

onMounted(() => {
  function clieckHandler() {
    openDropdown.value = false;
  }

  function ifEscClicked(ev: KeyboardEvent) {
    if (ev.key == "Escape") {
      openDropdown.value = false;
    }
  }

  window.addEventListener("focus", (ev) => {
    const target = ev.target as HTMLElement;
    if (target != dropdownWrapper.value) {
      clieckHandler();
    }
  });

  document.addEventListener(props.event, clieckHandler);
  document.addEventListener("keydown", ifEscClicked);
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
  <div @click.prevent.stop="() => {}" class="relative focus-within:z-50 z-10">
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
