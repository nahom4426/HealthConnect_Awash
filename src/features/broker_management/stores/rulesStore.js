import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { activateRule, deactivateRule, getRules, createRule as createRuleApi, updateRule as updateRuleApi } from '../api/rulesApi';

export const useRulesStore = defineStore('rulesStore', () => {
  const rules = ref([]);
  const currentRule = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const totalItems = ref(0);
  const isToggling = ref(false);

  // Getters
  const activeRules = computed(() => rules.value.filter(r => r.status === 'ACTIVE'));

  const rulesByPolicyType = computed(() => {
    return (type) => rules.value.filter(r => r.policyType === type);
  });

  // Actions
  async function fetchRules(params = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await getRules(params);
      const data = response.data.content || response.data || [];
      rules.value = data;

      if (response.data.totalElements !== undefined) {
        totalItems.value = response.data.totalElements;
      }
    } catch (err) {
      error.value = err?.response?.data?.message || err.message || 'Failed to fetch rules';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createRule(data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await createRuleApi(data);
      rules.value = [response.data, ...rules.value];
      totalItems.value++;
      return response.data;
    } catch (err) {
      error.value = err?.response?.data?.detail || err?.response?.data?.message || err.message || 'Failed to create rule';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateRule(id, data) {
    loading.value = true;
    error.value = null;
    try {
      const response = await updateRuleApi(id, data);

      if (response.success !== false) {
        const index = rules.value.findIndex(r => r.ruleUuid === id);
        if (index !== -1) {
          rules.value[index] = response.data;
        }
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update rule');
      }
    } catch (err) {
      error.value = err?.response?.data?.detail || err?.response?.data?.message || err.message || 'Failed to update rule';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleStatus(id, currentStatus) {
    // Prevent multiple simultaneous toggles
    if (isToggling.value) {
      console.warn('Toggle already in progress, skipping duplicate call');
      return;
    }

    isToggling.value = true;
    error.value = null;

    const originalIndex = rules.value.findIndex(r => r.ruleUuid === id);
    const originalStatus = originalIndex !== -1 ? rules.value[originalIndex].status : null;

    try {
      let response;
      if (currentStatus === 'ACTIVE') {
        response = await deactivateRule(id);
      } else {
        response = await activateRule(id);
      }

      // Check if response is successful
      if (response?.success === false) {
        throw new Error(response.error || 'Failed to toggle status');
      }

      // Update status in store
      const index = rules.value.findIndex(r => r.ruleUuid === id);
      if (index !== -1) {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        rules.value[index] = {
          ...rules.value[index],
          status: newStatus
        };
      }

      return response;
    } catch (err) {
      // Revert to original status on error
      if (originalIndex !== -1 && originalStatus !== null) {
        rules.value[originalIndex] = {
          ...rules.value[originalIndex],
          status: originalStatus
        };
      }

      const errorData = err?.response?.data;
      let errorMessage = 'Failed to toggle rule status';

      if (errorData?.detail) {
        if (errorData.detail.includes('Overlapping commission rule')) {
          errorMessage = 'Cannot activate rule: Overlapping commission rule already exists for this period.';
        } else if (errorData.detail.includes('Unable to find instance for payer')) {
          errorMessage = 'Service temporarily unavailable. Please try again later.';
        } else {
          errorMessage = errorData.detail;
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      error.value = errorMessage;
      throw err;
    } finally {
      // Reset toggling flag after a small delay to prevent rapid clicks
      setTimeout(() => {
        isToggling.value = false;
      }, 300);
    }
  }

  function reset() {
    rules.value = [];
    currentRule.value = null;
    loading.value = false;
    error.value = null;
    totalItems.value = 0;
    isToggling.value = false;
  }

  return {
    rules,
    currentRule,
    loading,
    error,
    totalItems,
    isToggling,
    activeRules,
    rulesByPolicyType,
    fetchRules,
    createRule,
    updateRule,
    toggleStatus,
    reset
  };
});