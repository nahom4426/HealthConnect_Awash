<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Chart, ChartOptions, ChartData, registerables } from 'chart.js';

Chart.register(...registerables);

// Props typing
const props = defineProps<{
  chartData: ChartData<'line'>;
  options?: ChartOptions<'line'>;
  height?: string;
  fill?: boolean;
}>();

const chartContainer = ref<HTMLCanvasElement | null>(null);
let chart: Chart<'line'> | null = null;

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
