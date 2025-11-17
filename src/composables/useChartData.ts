import { ref, computed } from 'vue';

export function useChartData() {
  const policyData = ref([65, 59, 80, 81, 56, 55]);
  const claimData = ref([28, 48, 40, 19, 36, 27]);
  const revenueData = ref([12, 19, 3, 5, 2, 3]);
  const months = ref(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']);

  const policyVsClaimData = computed(() => ({
    labels: months.value,
    datasets: [
      {
        label: 'Policies',
        data: policyData.value,
        backgroundColor: '#4C3F3F', 
        borderColor: '#4C3F3F',
        borderWidth: 1
      },
      {
        label: 'Claims',
        data: claimData.value,
        backgroundColor: '#55291B80',
        borderColor: '#55291B',
        borderWidth: 1
      }
    ]
  }));

  const revenueChartData = computed(() => ({
    labels: months.value,
    datasets: [{
      label: 'Revenue',
      data: revenueData.value,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  }));

  const fetchChartData = async () => {
    try {
      // Replace with actual API calls
      // const response = await api.getChartData();
      // policyData.value = response.policies;
      // claimData.value = response.claims;
      // revenueData.value = response.revenue;
      console.log('Fetching chart data...');
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  return {
    policyVsClaimData,
    revenueChartData,
    fetchChartData
  };
}
