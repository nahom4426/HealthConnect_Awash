<script setup lang="ts">
import icons from "@/utils/icons";
import {
  type PropType,
  computed,
  useAttrs,
} from "vue";

 const attrs = useAttrs();

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
      "primary" | "secondary" | "link" | "elevated" | "danger" | "edge-primary"
    >,
  },
});

const nativeButtonType = computed(() => {
  const fromHtmlType = (attrs as any)?.["html-type"] || (attrs as any)?.htmlType;
  const fromType = (attrs as any)?.type;
  return fromHtmlType || fromType || "button";
});
</script>
<template>
  <button
    v-bind="attrs"
    v-ripple
    :type="nativeButtonType"
    :class="[$style?.[size], $style?.[type ? type : '']]"
    class="flex relative justify-center items-center capitalize rounded btn"
  >
    <slot></slot>
    <p
      class="grid absolute inset-0 z-20 place-items-center backdrop-blur-xl bg-inherit"
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
</style>
