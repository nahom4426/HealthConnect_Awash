import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { createBroker as apiCreateBroker, getBroker as apiGetBroker, getBrokers as apiGetBrokers, updateBroker as apiUpdateBroker, updateBrokerStatus as apiUpdateBrokerStatus, deleteBroker as apiDeleteBroker } from '../api/brokerApi';

export const useBrokerStore = defineStore('brokerStore', () => {
  // State
  const brokers = ref([]);
  const currentBroker = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const isToggling = ref(false);

  // Filters/Pagination state
  const pagination = ref({ page: 0, size: 10, totalElements: 0, totalPages: 0 });
  const filters = ref({ search: '', status: 'ALL' });

  // Getters
  const activeBrokers = computed(() => brokers.value.filter(b => b.status === 'ACTIVE'));
  const activeAgents = computed(() => brokers.value.filter(b => b.status === 'ACTIVE' && b.type === 'AGENT'));
  const activeBrokersOnly = computed(() => brokers.value.filter(b => b.status === 'ACTIVE' && b.type === 'BROKER'));
  
  // Get active stakeholders by type ('BROKER' or 'AGENT')
  function activeStakeholdersByType(type) {
    return brokers.value.filter(b => b.status === 'ACTIVE' && b.type === type);
  }

  const totalBalance = computed(() => brokers.value.reduce((sum, b) => sum + (b.currentBalance || 0), 0));
  const filteredBrokers = computed(() => {
    let list = brokers.value;
    if (filters.value.status !== 'ALL') {
      list = list.filter(b => b.status === filters.value.status);
    }
    if (filters.value.search) {
      const q = filters.value.search.toLowerCase();
      list = list.filter(b =>
        (b.firstName + ' ' + b.lastName).toLowerCase().includes(q) ||
        b.email?.toLowerCase().includes(q) ||
        b.licenseNumber?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  // Actions
  async function fetchAllBrokers(params = { page: pagination.value.page, size: pagination.value.size, sortBy: 'createdAt', sortDir: 'DESC' }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiGetBrokers(params);
      // Assuming paginated response shape: { content: [], page: { number, size, totalElements, totalPages } }
      brokers.value = response.data.content || response.data;
      if (response.data.page) {
        pagination.value = { ...pagination.value, ...response.data.page };
      }
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to fetch brokers';
      console.error(err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchBrokerById(id) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiGetBroker(id);
      currentBroker.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to fetch broker details';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createBroker(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiCreateBroker(data);
      brokers.value.unshift(response.data); // Optimistically add to top
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to create broker';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateBroker(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await apiUpdateBroker(id, data);
      const index = brokers.value.findIndex(b => b.stakeholderUuid === id);
      if (index !== -1) {
        brokers.value[index] = response.data;
      }
      if (currentBroker.value?.stakeholderUuid === id) {
        currentBroker.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to update broker';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleStatus(id, currentStatus) {
    if (isToggling.value) {
      console.warn('Toggle already in progress, skipping duplicate call');
      return;
    }

    isToggling.value = true;
    error.value = null;

    const originalIndex = brokers.value.findIndex(b => b.stakeholderUuid === id);
    const originalStatus = originalIndex !== -1 ? brokers.value[originalIndex].status : null;

    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      const response = await apiUpdateBrokerStatus(id, newStatus);
      
      // Update status in store (re-assign the whole object for reactivity)
      const index = brokers.value.findIndex(b => b.stakeholderUuid === id);
      if (index !== -1) {
        brokers.value[index] = {
          ...brokers.value[index],
          status: newStatus
        };
      }
      
      if (currentBroker.value?.stakeholderUuid === id) {
        currentBroker.value = {
          ...currentBroker.value,
          status: newStatus
        };
      }
      
      return response.data || response;
    } catch (err) {
      // Revert to original status on error
      if (originalIndex !== -1 && originalStatus !== null) {
        brokers.value[originalIndex] = {
          ...brokers.value[originalIndex],
          status: originalStatus
        };
      }
      
      const errorData = err?.response?.data;
      let errorMessage = 'Failed to toggle broker status';

      if (errorData?.detail) {
        errorMessage = errorData.detail;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      error.value = errorMessage;
      throw err;
    } finally {
      setTimeout(() => {
        isToggling.value = false;
      }, 300);
    }
  }

  async function deleteBroker(id) {
    loading.value = true;
    error.value = null;
    try {
      await apiDeleteBroker(id);
      brokers.value = brokers.value.filter(b => b.stakeholderUuid !== id);
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to delete broker';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    brokers,
    currentBroker,
    loading,
    error,
    pagination,
    filters,
    activeBrokers,
    activeAgents,
    activeBrokersOnly,
    activeStakeholdersByType,
    totalBalance,
    filteredBrokers,
    fetchAllBrokers,
    fetchBrokerById,
    createBroker,
    updateBroker,
    toggleStatus,
    deleteBroker,
    isToggling
  };
});
