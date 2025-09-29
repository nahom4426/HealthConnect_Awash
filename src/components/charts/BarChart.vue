<script setup>
import { onMounted, ref, watch } from "vue";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

// Props
const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  options: Object,
  height: String,
  barThickness: Number,
  maxBarThickness: Number,
});

const chartContainer = ref(null);
let chart = null;

onMounted(() => {
  createChart();
});

watch(
  () => props.chartData,
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
  };

  // Apply bar thickness options if provided
  if (props.barThickness !== undefined || props.maxBarThickness !== undefined) {
    defaultOptions.datasets = {
      bar: {
        ...(props.barThickness !== undefined ? { barThickness: props.barThickness } : {}),
        ...(props.maxBarThickness !== undefined ? { maxBarThickness: props.maxBarThickness } : {}),
      },
    };
  }

  chart = new Chart(chartContainer.value, {
    type: "bar",
    data: props.chartData,
    options: { ...defaultOptions, ...props.options },
  });
}
</script>

<template>
  <div :style="{ height: props.height || '300px' }">
    <canvas ref="chartContainer"></canvas>
  </div>
</template>
