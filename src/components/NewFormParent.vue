<script setup lang="ts">
import { closeModal } from "@customizer/modal-x";
import Button from "./Button.vue";
import icons from "@/utils/icons";

const props = defineProps({
  size: {
    type: String,
    default: "md",
  },
  title: String,
  goBack: {
    type: Boolean,
    default: false,
  },
  onGoBack: {
    type: Function,
  },
  error: {
    type: String,
  },
  showCloseModal: {
    type: Boolean,
    default: true,
  },

  // ✅ ADD THIS
  isEdit: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    :class="[$style[size]]"
    class="flex overflow-hidden flex-col justify-between bg-white rounded-md"
  >
    <div
      class="flex justify-between items-center p-2 pr-4 border-b border-text-secondary-clr/30"
    >
      <div class="flex gap-4 items-center">
        <button
          @click="() => onGoBack && onGoBack()"
          v-if="goBack"
          class="grid place-items-center rounded-md border border-text-clr"
        >
        </button>
        <p class="p-3 px-4 text-base font-semibold">{{ title }}</p>
      </div>
      <div class="flex gap-4 items-center">
        <slot name="right-actions"></slot>
        <button v-if="showCloseModal" class="rounded-full border" @click.prevent="closeModal()">
          <i v-html="icons.close" />
        </button>
      </div>
    </div>
    <div
      class="flex overflow-y-auto flex-col flex-1 gap-4 p-4 border-b form-scrollbar border-text-secondary-clr/30"
      style="max-height: calc(100vh - 6rem);"
    >
      <slot />
      <!--<ResponseError :error="error" />-->
    </div>
    <slot name="bottom" />
  </div>
</template>

<style module>
.md {
  width: 35rem;
  max-height: calc(100vh - 2rem);
}

.mdd {
  width: 55rem;
  max-height: calc(100vh - 2rem);
}

.lg {
  width: 60rem;
  max-height: calc(100vh - 2rem);
}
.xmd {
  width: 75rem;
  max-height: calc(100vh - 2rem);
}
.xl {
  width: 100%;
  max-height: calc(100vh - 2rem);
}

.xs {
  max-width: 80%;
  max-height: auto;
}
</style>

<style>
.form-layout {
  display: grid;
}

.form-scrollbar::-webkit-scrollbar {
  display: block;
  width: 5px;
}

.form-scrollbar::-webkit-scrollbar-thumb {
  background-color: red;
  border-radius: 50px;
}
</style>
