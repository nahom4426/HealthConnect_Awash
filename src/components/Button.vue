<script setup lang="ts">
import icons from "@/utils/icons";
import {
  type PropType,
} from "vue";

const props = defineProps({
  pending: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<"xs" | "sm" | "md" | "lg">,
    default: "sm",
  },
  type: {
    type: String as PropType<
      | "primary" | "secondary" | "link" | "elevated" | "danger" | "edge-primary"
      | "success" | "warning" | "info" | "indigo" | "purple" | "emerald" | "gray"
    >,
  },
});
</script>
<template>
  <button
    v-ripple
    :class="[$style?.[size], $style?.[type ? type : '']]"
    class="relative btn flex items-center justify-center rounded capitalize"
  >
    <slot></slot>
    <p
      class="absolute bg-inherit backdrop-blur-xl inset-0 z-20 grid place-items-center"
      v-if="pending"
      v-html="icons.spinner"
    />
  </button>
</template>
<style scoped>
.btn {
  padding-left: 1rem /* 16px */;
  padding-right: 1rem;
  padding-top: 0.25rem /* 4px */;
  padding-bottom: 0.25rem;
}
</style>
<style module>
.xs {
  width: auto;
  height: auto;
}

.sm {
  min-width: 3.6rem;
  min-height: 2rem;
}

.link {
  min-width: auto;
  min-height: min-content;
  padding: 0 !important;
  position: relative;
  display: flex;
  font-size: theme('spacing[3.5]');
  font-weight: 500;
  letter-spacing: theme('letterSpacing.tighter');
  /*background-color: #0001;*/
  border-radius: 0;
  border-radius: 3px;
  padding: 2px;
  /*@apply shadow*/
}

.link::before {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1px;
  background-color: theme("colors.gray.500");
  width: 100%;
  transition: transform 0.15s ease-in-out;
  transform: translateX(-100%);
}

.link:hover::before {
  font-style: italic;
  transform: translateX(0);
}

.md {
  min-width: 6.8rem;
  min-height: 3rem;
}

.lg {
  min-width: 6.8rem;
  min-height: 2.5rem;
}

.secondary {
  @apply bg-secondary text-white;
}

.primary {
  @apply bg-primary text-white;
}

.elevated {
  @apply bg-black/10 shadow-md;
}

.danger {
  @apply bg-red-500 text-white shadow-md;
}

.edge-primary {
  @apply border border-primary text-primary shadow-md;
}

.success {
  @apply bg-green-600 text-white shadow-md hover:bg-green-500;
}

.warning {
  @apply bg-amber-500 text-white shadow-md hover:bg-amber-400;
}

.info {
  @apply bg-blue-500 text-white shadow-md hover:bg-blue-400;
}

.indigo {
  @apply bg-indigo-600 text-white shadow-md hover:bg-indigo-500;
}

.purple {
  @apply bg-purple-600 text-white shadow-md hover:bg-purple-500;
}

.emerald {
  @apply bg-emerald-600 text-white shadow-md hover:bg-emerald-500;
}

.gray {
  @apply bg-gray-600 text-white shadow-md hover:bg-gray-500;
}
</style>
