<script setup lang="ts">
import icons from "@/utils/icons";
import { type PropType, computed, useAttrs, useSlots } from "vue";

const attrs = useAttrs();
const slots = useSlots();

const props = defineProps({
  pending: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<"xs" | "sm" | "md" | "lg" | "xl" | "icon">,
    default: "md",
  },
  variant: {
    type: String as PropType<
      "primary" | "secondary" | "ghost" | "outline" | "destructive" | "success" | "link" | "elevated"
    >,
    default: "primary",
  },
  // Legacy 'type' prop support for backward compatibility
  type: {
    type: String as PropType<
      "primary" | "secondary" | "link" | "elevated" | "danger" | "edge-primary" | "ghost" | "outline" | "destructive" | "success"
    >,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  rounded: {
    type: String as PropType<"default" | "full" | "none">,
    default: "default",
  },
});

const nativeButtonType = computed(() => {
  const fromHtmlType = (attrs as any)?.["html-type"] || (attrs as any)?.htmlType;
  const fromType = (attrs as any)?.type;
  if (fromHtmlType) return fromHtmlType;
  if (fromType && ["submit", "reset", "button"].includes(fromType)) return fromType;
  return "button";
});

// Resolve variant from new 'variant' prop or legacy 'type' prop
const resolvedVariant = computed(() => {
  const v = props.variant || props.type || "primary";
  // Map legacy names
  if (v === "danger") return "destructive";
  if (v === "edge-primary") return "outline";
  return v;
});

// Detect icon-only mode (explicit prop OR single icon slot with no text)
const isIconOnly = computed(() => props.iconOnly || props.size === "icon");

// Size classes
const sizeClasses = computed(() => {
  if (isIconOnly.value) {
    const iconSizes: Record<string, string> = {
      xs: "w-7 h-7 text-xs",
      sm: "w-8 h-8 text-sm",
      md: "w-9 h-9 text-sm",
      lg: "w-10 h-10 text-base",
      xl: "w-12 h-12 text-lg",
      icon: "w-9 h-9 text-sm",
    };
    return iconSizes[props.size] || iconSizes.md;
  }

  const sizes: Record<string, string> = {
    xs: "h-7 px-2.5 text-xs gap-1",
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-9 px-4 text-sm gap-2",
    lg: "h-10 px-5 text-sm gap-2",
    xl: "h-12 px-6 text-base gap-2.5",
    icon: "w-9 h-9 text-sm",
  };
  return sizes[props.size] || sizes.md;
});

// Variant classes
const variantClasses = computed(() => {
  const variants: Record<string, string> = {
    primary:
      "bg-primary text-white shadow-xs hover:bg-primary/90 hover:shadow-soft active:shadow-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
    secondary:
      "bg-secondary text-white shadow-xs hover:bg-secondary/90 hover:shadow-soft active:shadow-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1",
    outline:
      "bg-white text-gray-700 border border-gray-200 shadow-xs hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
    destructive:
      "bg-red-500 text-white shadow-xs hover:bg-red-600 hover:shadow-soft active:shadow-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2",
    success:
      "bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 hover:shadow-soft active:shadow-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2",
    link:
      "bg-transparent text-primary underline-offset-4 hover:underline hover:text-primary/80 p-0 h-auto",
    elevated:
      "bg-white text-gray-700 shadow-soft border border-gray-100 hover:shadow-medium hover:border-gray-200 active:shadow-xs focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1",
  };
  return variants[resolvedVariant.value] || variants.primary;
});

// Rounded classes
const roundedClasses = computed(() => {
  const r: Record<string, string> = {
    default: "rounded-lg",
    full: "rounded-full",
    none: "rounded-none",
  };
  return r[props.rounded] || r.default;
});

// Combined button classes
const buttonClasses = computed(() => {
  return [
    // Base
    "inline-flex items-center justify-center font-medium",
    "transition-all duration-150 ease-smooth",
    "select-none whitespace-nowrap",
    "outline-none",
    // Active press
    "active:scale-[0.97]",
    // Size
    sizeClasses.value,
    // Variant
    variantClasses.value,
    // Rounded
    roundedClasses.value,
    // Full width
    props.fullWidth ? "w-full" : "",
    // Disabled
    (props.disabled || props.pending) ? "opacity-50 pointer-events-none cursor-not-allowed" : "cursor-pointer",
  ];
});
</script>

<template>
  <button
    v-bind="attrs"
    :type="nativeButtonType"
    :class="buttonClasses"
    :disabled="disabled || pending"
    :aria-disabled="disabled || pending"
    :aria-busy="pending"
  >
    <!-- Loading State -->
    <template v-if="pending">
      <svg
        class="animate-spin"
        :class="isIconOnly ? 'w-4 h-4' : 'w-4 h-4'"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <span v-if="!isIconOnly" class="ml-1.5">Loading...</span>
    </template>

    <!-- Default Content -->
    <template v-else>
      <slot />
    </template>
  </button>
</template>
