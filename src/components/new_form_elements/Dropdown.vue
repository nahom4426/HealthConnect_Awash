<script setup>
import { ref, watch, onMounted, onUpdated, onBeforeUnmount, nextTick } from "vue";
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

function close() {
  openDropdown.value = false;
}

function onKeydown(e) {
  if (e.key === "Escape" && openDropdown.value) {
    close();
    e.stopPropagation();
  }
}

/*
 * Inside a scrolling box (e.g. a table), an absolutely positioned menu gets clipped.
 * There the open menu is placed with position: fixed next to its trigger instead,
 * flipping above it when there isn't room below.
 */
const floating = ref(false);

function clippingAncestor(el) {
  let node = el?.parentElement;
  while (node && node !== document.body && node.tagName !== "MAIN") {
    const cs = getComputedStyle(node);
    if (/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) return node;
    node = node.parentElement;
  }
  return null;
}

function placeFloating() {
  const menu = dropdown.value;
  const anchor = menu?.closest(".dropdown");
  if (!menu || !anchor || !openDropdown.value) return;
  const rect = anchor.getBoundingClientRect();
  const menuW = menu.offsetWidth;
  const menuH = menu.offsetHeight;
  const gap = 4;
  const margin = 8;

  let top = rect.bottom + gap;
  if (top + menuH > window.innerHeight - margin && rect.top - menuH - gap > margin) {
    top = rect.top - menuH - gap; // not enough room below: open upwards
  }
  let left = rect.right - menuW; // right-aligned with the trigger
  left = Math.max(margin, Math.min(left, window.innerWidth - menuW - margin));

  Object.assign(menu.style, {
    position: "fixed",
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    right: "auto",
    bottom: "auto",
    zIndex: "60",
  });
}

function clearFloating() {
  const menu = dropdown.value;
  if (!menu) return;
  ["top", "left", "right", "bottom"].forEach((k) => menu.style.removeProperty(k));
  menu.style.position = "absolute";
  menu.style.zIndex = 20;
}

function onViewportChange() {
  if (floating.value) placeFloating();
}

function startFloating() {
  floating.value = true;
  nextTick(placeFloating);
  window.addEventListener("scroll", onViewportChange, true);
  window.addEventListener("resize", onViewportChange);
}

function stopFloating() {
  if (!floating.value) return;
  floating.value = false;
  window.removeEventListener("scroll", onViewportChange, true);
  window.removeEventListener("resize", onViewportChange);
  clearFloating();
}

function setValue() {
  if (!openDropdown.value) {
    dropdown.value.style.display = "none";
    stopFloating();
  } else {
    dropdown.value.style.removeProperty("display");
    if (clippingAncestor(dropdown.value.closest(".dropdown"))) startFloating();
  }
}

function setStyle() {
  if (!dropdown.value) return;
  if (floating.value) {
    placeFloating();
    return;
  }
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
onBeforeUnmount(stopFloating);
</script>

<template>
  <OnClickOutside
    :class="[!dropdown ? 'loading-dropdown' : 'dropdown']"
    class="inline-flex relative"
    @trigger="close"
    @keydown="onKeydown"
  >
    <slot
      :setRef="setRef"
      :toggleDropdown="toggleDropdown"
      :open="openDropdown"
      :close="close"
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
