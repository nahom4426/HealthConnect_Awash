<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Chart, registerables } from "chart.js";
import { applyChartDefaults } from "@/config/chartPalette";

Chart.register(...registerables);
applyChartDefaults();

// Props
const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  options: Object,
  height: String,
});

const chartContainer = ref(null);
let chart = null;

onMounted(() => {
  createChart();
});

// Release the chart.js instance (and its listeners/animation frames) on unmount
onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});

watch(
  () => props.data,
  (newData) => {
    if (chart) {
      chart.data = newData;
      chart.update();
    }
  },
  { deep: true }
);

function createChart() {
  if (!chartContainer.value) return;

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  chart = new Chart(chartContainer.value, {
    type: "doughnut",
    data: props.data,
    options: { ...defaultOptions, ...props.options },
  });
}
</script>

<template>
  <div :style="{ height: props.height || '300px' }">
    <canvas ref="chartContainer"></canvas>
  </div>
</template>
