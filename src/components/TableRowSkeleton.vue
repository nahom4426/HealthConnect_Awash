<script setup>
const props = defineProps({
  cols: {
    type: Number,
    required: true
  }
})
</script>

<template>
  <tr class="relative bg-white border-b border-slate-100">
    <td 
      class="px-4 py-4" 
      v-for="num in cols" 
      :key="num"
    >
      <!-- Modern skeleton with gradient animation -->
      <div class="relative overflow-hidden rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer">
        <!-- Base skeleton bar -->
        <div class="w-full h-4 rounded-lg"></div>
        
        <!-- Shimmer overlay effect -->
        <div class="absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full animate-shimmer via-white/40"></div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}

/* Alternative: pulse animation fallback */
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer {
    animation: none;
  }
  
  .bg-gradient-to-r {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>