<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { Chart, ChartOptions, ChartData, registerables, BarControllerChartOptions } from "chart.js";

Chart.register(...registerables);

// Props typing
const props = defineProps<{
  chartData: ChartData<"bar">;
  options?: ChartOptions<"bar">;
  height?: string;
  barThickness?: number;
  maxBarThickness?: number;
}>();

const chartContainer = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"bar"> | null = null;

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

  const defaultOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // Apply bar thickness options if provided
  if (props.barThickness !== undefined || props.maxBarThickness !== undefined) {
    defaultOptions.datasets = {
      bar: {
        ...(props.barThickness !== undefined ? { barThickness: props.barThickness } : {}),
        ...(props.maxBarThickness !== undefined ? { maxBarThickness: props.maxBarThickness } : {}),
      } as any, // Chart.js typing for dataset options can be tricky
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
