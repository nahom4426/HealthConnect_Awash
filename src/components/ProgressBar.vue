<script setup lang="ts">
defineProps({
  percentage: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    default: "#FF8F0D",
  },
  height: {
    type: String,
    default: "0.3rem",
  },
  width: {
    type: String,
    default: "100%",
  },
});
</script>

<template>
  <div class="progress-container">
    <div
      class="progress-bg"
      :style="{
        height,
        width,
      }"
    >
      <div
        class="progress-bar"
        :style="{
          width: `${percentage}%`,
          backgroundColor: color,
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.progress-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.progress-bg {
  width: 100%;
  background-color: #ffd5a4;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}
</style>
