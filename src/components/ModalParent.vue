<script setup>
import { closeModal } from "@customizer/modal-x";
import { useModal } from "../../node_modules/@customizer/modal-x/store/modal";
import { watch, ref, getCurrentInstance, onMounted, onUnmounted, nextTick } from "vue";

const props = defineProps({
  autoClose: {
    type: Boolean,
    default: true,
  },
  name: {
    type: String,
    default: "",
  },
});

const CLOSE_ANIMATION_MS = 160;

const { modals, getModal } = useModal();
const instance = getCurrentInstance();
const name =
  props.name ||
  (instance.parent?.type?.__name ? instance.parent.type.__name.split(".")[0] : props.name);

const modal = ref();
const isClosing = ref(false);
const contentEl = ref(null);
let previouslyFocused = null;

watch(
  modals,
  () => {
    const wasActive = modal.value?.active;
    modal.value = getModal(name);
    if (modal.value?.active) {
      isClosing.value = false;
      if (!wasActive) focusDialog();
    }
  },
  { immediate: true }
);

// Move focus into the dialog unless something inside already took it (v-focus inputs)
function focusDialog() {
  previouslyFocused = document.activeElement;
  nextTick(() => {
    if (contentEl.value && !contentEl.value.contains(document.activeElement)) {
      contentEl.value.focus({ preventScroll: true });
    }
  });
}

function escListener(e) {
  if (e.key === "Escape" && modals?.length && props.autoClose && modal.value?.active) {
    handleClose();
  }
}

function handleClose() {
  if (isClosing.value) return;
  isClosing.value = true;
  setTimeout(() => {
    closeModal();
    isClosing.value = false;
    previouslyFocused?.focus?.({ preventScroll: true });
  }, CLOSE_ANIMATION_MS);
}

onMounted(() => document.addEventListener("keydown", escListener));
onUnmounted(() => document.removeEventListener("keydown", escListener));
</script>

<template>
  <div
    :class="[!modal?.active ? '__inactive' : '__active', isClosing ? '__closing' : '']"
    class="grid place-items-center p-3 min-h-full modal-parent sm:p-6"
  >
    <div
      ref="contentEl"
      class="modal-content"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <slot v-bind="modal || {}"></slot>
    </div>
  </div>
</template>

<style scoped>
.modal-parent {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  background-color: rgb(15 23 42 / 0.45);
  transition: background-color 160ms ease;
}

.modal-parent.__closing {
  background-color: transparent;
}

.modal-content {
  max-width: 100%;
  max-height: calc(100dvh - 1.5rem);
  overflow: auto;
  background: rgb(var(--surface));
  border-radius: 0.75rem;
  box-shadow: 0 24px 48px -12px rgb(16 24 40 / 0.25);
  transform-origin: center;
  animation: modal-in 180ms var(--ease-out) both;
}

.modal-content:focus {
  outline: none;
}

/* Children with fixed widths still fit small screens */
.modal-content > :deep(*) {
  max-width: 100%;
}

.__closing .modal-content {
  animation: modal-out 160ms ease-in both;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes modal-out {
  to {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
}
</style>
