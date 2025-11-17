<script setup>
import { onMounted, ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Props
const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  options: Object,
  height: String,
  fill: Boolean,
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

  // Apply fill option to datasets if needed
  if (props.fill && props.chartData.datasets) {
    props.chartData.datasets.forEach(dataset => {
      dataset.fill = true;
    });
  }

  chart = new Chart(chartContainer.value, {
    type: 'line',
    data: props.chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...props.options
    }
  });
}
</script>

<template>
  <div :style="{ height: props.height || '300px' }">
    <canvas ref="chartContainer"></canvas>
  </div>
</template>
