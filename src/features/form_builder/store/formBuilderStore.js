import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  fetchFormSchemas,
  fetchFormSchema,
  saveFormSchema,
  publishFormSchema,
  deleteFormSchema,
  fetchRateConfigs,
  saveRateConfig,
  publishRateConfig,
} from '../api/formBuilderApi';

export const useFormBuilderStore = defineStore('formBuilder', () => {
  const schemas = ref([]);
  const activeSchema = ref(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref(null);

  // Editor State
  const selectedStepIndex = ref(0);
  const selectedFieldId = ref(null);
  const activeTab = ref('editor'); // 'editor', 'json', 'preview'

  const activeSteps = computed(() => {
    if (!activeSchema.value || !activeSchema.value.schemaJson) return [];
    try {
      const parsed = typeof activeSchema.value.schemaJson === 'string'
        ? JSON.parse(activeSchema.value.schemaJson)
        : activeSchema.value.schemaJson;
      return parsed.steps || [];
    } catch {
      return [];
    }
  });

  const activeStep = computed(() => {
    return activeSteps.value[selectedStepIndex.value] || null;
  });

  const selectedField = computed(() => {
    if (!activeStep.value || !selectedFieldId.value) return null;
    return activeStep.value.fields.find(f => f.id === selectedFieldId.value) || null;
  });

  // Actions
  async function loadSchemas(productId) {
    loading.value = true;
    error.value = null;
    try {
      schemas.value = await fetchFormSchemas(productId);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function loadSchema(formUuid) {
    loading.value = true;
    error.value = null;
    try {
      const schema = await fetchFormSchema(formUuid);
      activeSchema.value = schema;
      selectedStepIndex.value = 0;
      selectedFieldId.value = null;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  function initNewSchema(productId, name) {
    const defaultSchemaJson = JSON.stringify({
      formId: `${productId}_proposal`,
      title: `${name || productId} Proposal Form`,
      version: '1.0',
      steps: [
        {
          stepId: 'step_1',
          stepTitle: 'Particulars & Coverage',
          fields: [
            {
              id: 'full_name',
              type: 'text',
              label: 'Full Name / Company Name',
              required: true,
              placeholder: 'Enter applicant full name',
            },
            {
              id: 'phone_number',
              type: 'text',
              label: 'Phone Number',
              required: true,
              placeholder: '+251 9...',
            },
          ],
        },
      ],
    }, null, 2);

    activeSchema.value = {
      formUuid: null,
      formId: `${productId}_proposal`,
      productId,
      version: '1.0',
      status: 'DRAFT',
      schemaJson: defaultSchemaJson,
    };
    selectedStepIndex.value = 0;
    selectedFieldId.value = 'full_name';
  }

  function updateSchemaJson(newStepsObj) {
    if (!activeSchema.value) return;
    try {
      let currentObj = typeof activeSchema.value.schemaJson === 'string'
        ? JSON.parse(activeSchema.value.schemaJson)
        : (activeSchema.value.schemaJson || {});
      currentObj.steps = newStepsObj;
      activeSchema.value.schemaJson = JSON.stringify(currentObj, null, 2);
    } catch (e) {
      console.error('Failed to update schema JSON:', e);
    }
  }

  async function saveActiveSchema() {
    if (!activeSchema.value) return;
    saving.value = true;
    try {
      const saved = await saveFormSchema({
        formUuid: activeSchema.value.formUuid,
        formId: activeSchema.value.formId,
        productId: activeSchema.value.productId,
        version: activeSchema.value.version,
        schemaJson: activeSchema.value.schemaJson,
      });
      activeSchema.value = saved;
      return saved;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      saving.value = false;
    }
  }

  async function publishActiveSchema() {
    if (!activeSchema.value || !activeSchema.value.formUuid) {
      await saveActiveSchema();
    }
    saving.value = true;
    try {
      const published = await publishFormSchema(activeSchema.value.formUuid);
      activeSchema.value = published;
      return published;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      saving.value = false;
    }
  }

  return {
    schemas,
    activeSchema,
    loading,
    saving,
    error,
    selectedStepIndex,
    selectedFieldId,
    activeTab,
    activeSteps,
    activeStep,
    selectedField,
    loadSchemas,
    loadSchema,
    initNewSchema,
    updateSchemaJson,
    saveActiveSchema,
    publishActiveSchema,
  };
});
