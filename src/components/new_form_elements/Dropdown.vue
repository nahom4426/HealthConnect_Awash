<script setup>
import { ref, watch, onMounted, onUpdated } from "vue";
import { vOnClickOutside, OnClickOutside } from "@vueuse/components";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  position: {
    type: String,
    default: "bottom-right",
  },
  top: {
    type: String,
    default: "100%",
  },
  right: {
    type: String,
    default: "0",
  },
  left: {
    type: String,
  },
  bottom: {
    type: String,
  },
});

onUpdated(() => {
  setStyle();
});

const openDropdown = ref(props.open);
const dropdown = ref("");

function setRef(el) {
  dropdown.value = el;
}

function toggleDropdown() {
  openDropdown.value = !openDropdown.value;
}

function setValue() {
  if (!openDropdown.value) dropdown.value.style.display = "none";
  else dropdown.value.style.removeProperty("display");
}

function setStyle() {
  dropdown.value.style.position = "absolute";
  dropdown.value.style.zIndex = 20;

  dropdown.value.style.setProperty("--top", props.top);
  dropdown.value.style.setProperty("--right", props.right);
  dropdown.value.style.setProperty("--left", props.left);
  dropdown.value.style.setProperty("--bottom", props.bottom);

  setValue();

  if (props.position == "bottom-right") {
    dropdown.value.classList.add("bottom-right");
  }
}

watch(openDropdown, setValue);
watch(props, setStyle);

onMounted(setStyle);
</script>

<template>
  <OnClickOutside
    :class="[!dropdown ? 'loading-dropdown' : 'dropdown']"
    class="inline-flex relative"
    @trigger="openDropdown = false"
  >
    <slot
      :setRef="setRef"
      :toggleDropdown="toggleDropdown"
      :open="openDropdown"
    ></slot>
  </OnClickOutside>
</template>

<style>
.loading-dropdown * {
  visibility: hidden;
}

.bottom-right {
  top: var(--top);
  right: var(--right);
}
</style>
