<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  },
  height: {
    type: String,
    default: '300px'
  },
  fill: {
    type: Boolean,
    default: false
  }
});

const chartContainer = ref(null);
let chart = null;

onMounted(() => {
  createChart();
});

watch(() => props.chartData, (newData) => {
  if (chart) {
    chart.data = newData;
    chart.update();
  }
}, { deep: true });

function createChart() {
  if (chartContainer.value) {
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
}
</script>

<template>
  <div :style="{ height }">
    <canvas ref="chartContainer"></canvas>
  </div>
</template>