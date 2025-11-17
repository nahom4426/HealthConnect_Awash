<script setup lang="ts">
import { closeModal } from "@customizer/modal-x";
import Button from "./Button.vue";
//import ResponseError from "./ResponseError.vue";
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
    default: true
  }
});
</script>
<template>
  <div
    :class="[$style[size]]"
    class="overflow-hidden flex flex-col justify-between bg-white rounded-md"
  >
    <div
      class="flex justify-between border-b p-2 pr-4 border-text-secondary-clr/30 items-center"
    >
      <div class="flex items-center gap-4">
        <button
          @click="() => onGoBack && onGoBack()"
          v-if="goBack"
          class="grid place-items-center rounded-md border border-text-clr"
        >
        </button>
        <p class="font-semibold text-base px-4 p-3">{{ title }}</p>
      </div>
      <div class="flex items-center gap-4">
        <slot name="right-actions"></slot>
        <button v-if="showCloseModal" class="border rounded-full" @click.prevent="closeModal()">
          <i v-html="icons.close" />
        </button>
      </div>
    </div>
    <div
      class="flex flex-col p-4 gap-4 form-scrollbar flex-1 overflow-auto border-b border-text-secondary-clr/30"
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
  max-height: 37rem;
}

.mdd {
  width: 45rem;
  max-height: 37rem;
}

.lg {
  width: 60rem;
  max-height: 100%;
}

.xl {
  width: 100%;
  max-height: 100%;
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
