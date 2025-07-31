<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  height: {
    type: String,
    default: "300px",
  },
  barThickness: {
    type: Number,
    default: undefined,
  },
  maxBarThickness: {
    type: Number,
    default: undefined,
  },
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
  if (chartContainer.value) {
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      datasets: {
        bar: {},
      },
    };

    if (props.barThickness !== undefined) {
      defaultOptions.datasets.bar.barThickness = props.barThickness;
    }

    if (props.maxBarThickness !== undefined) {
      defaultOptions.datasets.bar.maxBarThickness = props.maxBarThickness;
    }

    chart = new Chart(chartContainer.value, {
      type: "bar",
      data: props.chartData,
      options: {
        ...defaultOptions,
        ...props.options,
      },
    });
  }
}
</script>

<template>
  <div :style="{ height }">
    <canvas ref="chartContainer"></canvas>
  </div>
</template>
