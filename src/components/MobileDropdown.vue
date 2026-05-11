<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      :style="style"
      data-mobile-dropdown="true"
      class="mobile-dropdown-container"
      @click.stop
    >
      <div class="mobile-dropdown-content">
        <slot :row="activeRow" :close="close" />
      </div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  style: {
    type: Object,
    default: () => ({})
  },
  activeRow: {
    type: Object,
    default: null
  },
  close: {
    type: Function,
    default: () => {}
  }
});
</script>

<style scoped>
.mobile-dropdown-container {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  overflow: hidden;
  max-height: 50vh;
  overflow-y: auto;
}

.mobile-dropdown-content {
  padding: 8px 0;
}

/* Smooth scrollbar for mobile dropdown */
.mobile-dropdown-container::-webkit-scrollbar {
  width: 4px;
}

.mobile-dropdown-container::-webkit-scrollbar-track {
  background: transparent;
}

.mobile-dropdown-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.mobile-dropdown-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Modern button styles for dropdown items */
:deep(.dropdown-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

:deep(.dropdown-item:last-child) {
  border-bottom: none;
}

:deep(.dropdown-item:hover) {
  background: rgba(59, 130, 246, 0.05);
  color: #1d4ed8;
  transform: translateX(2px);
}

:deep(.dropdown-item:active) {
  transform: translateX(2px) scale(0.98);
}

:deep(.dropdown-item.danger) {
  color: #dc2626;
}

:deep(.dropdown-item.danger:hover) {
  background: rgba(220, 38, 38, 0.05);
  color: #b91c1c;
}

:deep(.dropdown-item.success) {
  color: #059669;
}

:deep(.dropdown-item.success:hover) {
  background: rgba(5, 150, 105, 0.05);
  color: #047857;
}

:deep(.dropdown-item-icon) {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

:deep(.dropdown-item:hover .dropdown-item-icon) {
  opacity: 1;
}
</style>
