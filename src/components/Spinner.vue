<template>
  <div class="spinner-container">
    <div class="spinner">
      <div class="spinner-inner">
        <div class="spinner-core"></div>
      </div>
      <p class="loading-text">Loading...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// No logic needed
</script>

<style scoped>
.spinner-container {
  @apply flex justify-center items-center min-h-[300px] w-full;
}

.spinner {
  @apply flex flex-col items-center gap-4;
}

.spinner-inner {
  position: relative;
  width: 60px;
  height: 60px;
  animation: rotate 1.8s linear infinite;
}

.spinner-core {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  border: 4px solid transparent;
  border-top-color: #3b82f6;
  border-bottom-color: #3b82f6;
  animation: spin 1.2s ease-in-out infinite;
}

.spinner-inner::before {
  content: "";
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border-radius: 9999px;
  border: 4px solid transparent;
  border-left-color: #10b981;
  border-right-color: #10b981;
  animation: spinReverse 1.4s linear infinite;
}

.loading-text {
  font-family: "Segoe UI", sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.05em;
  text-shadow: 0 0 5px rgba(75, 85, 99, 0.5);
  animation: pulse 1.5s ease-in-out infinite,
    glow 1.5s ease-in-out infinite alternate;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
    border-top-color: #10b981;
    border-bottom-color: #10b981;
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spinReverse {
  0% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-180deg);
    border-left-color: #3b82f6;
    border-right-color: #3b82f6;
  }
  100% {
    transform: rotate(-360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes glow {
  0% {
    text-shadow: 0 0 5px rgba(75, 85, 99, 0.5);
  }
  100% {
    text-shadow: 0 0 20px rgba(75, 85, 99, 1);
  }
}
</style>
