<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "📊",
  },
});
</script>

<template>
  <div class="group relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:border-blue-200">
    <!-- Gradient accent on hover -->
    <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/5 to-indigo-400/5 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-300"></div>
    
    <!-- Header -->
    <div class="relative z-10 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span class="text-2xl">{{ icon }}</span>
            {{ title }}
          </h2>
          <p v-if="subtitle" class="text-sm text-gray-500 mt-1">{{ subtitle }}</p>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="relative z-10 p-6">
      <div class="chart-container">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
}
</style>
