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
    const isMotor = productId === 'motor';

    const motorSteps = [
      {
        stepId: 'step_1',
        stepTitle: '1. Proposer & License Particulars',
        fields: [
          { id: 'proposerAge', type: 'number', label: 'Proposer Age', required: true, placeholder: 'e.g. 32' },
          { id: 'proposerAddress', type: 'text', label: 'Residential Address / Kebele / House No.', required: true, placeholder: 'e.g. Bole Sub-city, Woreda 03, House #120' },
          { id: 'poBox', type: 'text', label: 'P.O. Box Number', required: false, placeholder: 'e.g. P.O. Box 12753' },
          { id: 'tradeProfession', type: 'text', label: 'Trade or Profession', required: true, placeholder: 'e.g. Business Executive' },
          { id: 'licenseNo', type: 'text', label: 'Ethiopian Driving License Number', required: true, placeholder: 'e.g. ETH-DL-994821' },
          { id: 'licenseIssueDate', type: 'date', label: 'License First Issue Date', required: true, placeholder: 'YYYY-MM-DD' },
        ],
      },
      {
        stepId: 'step_2',
        stepTitle: '2. Vehicle Specifications & Usage',
        fields: [
          { id: 'categoryName', type: 'dropdown', label: 'Vehicle Category', required: true, options: [{ label: 'Private Automobiles', value: 'Private Automobiles' }, { label: 'Commercial Vehicles', value: 'Commercial Vehicles' }, { label: 'Motorcycles', value: 'Motorcycles' }] },
          { id: 'bodyType', type: 'text', label: 'Body Type', required: true, placeholder: 'e.g. Saloon / Station Wagon / SUV' },
          { id: 'overnightParking', type: 'dropdown', label: 'Overnight Parking Facility', required: true, options: [{ label: 'Private Locked Garage', value: 'GARAGE' }, { label: 'Fenced Private Compound', value: 'COMPOUND' }, { label: 'Public Street Parking', value: 'STREET' }] },
          { id: 'isSoleProperty', type: 'dropdown', label: 'Is Vehicle your Sole Property?', required: true, options: [{ label: 'YES (Sole Owner)', value: 'true' }, { label: 'NO', value: 'false' }] },
          { id: 'isHirePurchase', type: 'dropdown', label: 'Subject to Hire Purchase / Bank Mortgage?', required: true, options: [{ label: 'YES (Bank Mortgage)', value: 'true' }, { label: 'NO', value: 'false' }] },
          { id: 'financierNameAddress', type: 'text', label: 'Financier / Bank Name & Address', required: false, placeholder: 'e.g. Awash Bank S.C. Main Branch' },
          { id: 'privatePurposeOnly', type: 'dropdown', label: 'Used Solely for Private & Social Purposes?', required: true, options: [{ label: 'YES (Private / Social Only)', value: 'true' }, { label: 'NO', value: 'false' }] },
        ],
      },
      {
        stepId: 'step_3',
        stepTitle: '3. Driving Record & PA Declarations',
        fields: [
          { id: 'drivingYearsSelf', type: 'number', label: 'Self Driving Experience (Years)', required: true, placeholder: 'e.g. 5' },
          { id: 'hasPhysicalInfirmity', type: 'dropdown', label: 'Any Physical Infirmity / Vision Defect?', required: true, options: [{ label: 'NONE (Good Health)', value: 'false' }, { label: 'YES', value: 'true' }] },
          { id: 'hasDrivingConvictions', type: 'dropdown', label: 'Past Traffic Convictions or Offenses?', required: true, options: [{ label: 'NONE (Clean Record)', value: 'false' }, { label: 'YES', value: 'true' }] },
          { id: 'convictionDetails', type: 'text', label: 'Conviction / Offense Details', required: false, placeholder: 'Specify conviction dates and fines' },
          { id: 'hasRadioAccessories', type: 'dropdown', label: 'Include Radio & Audio Accessories?', required: true, options: [{ label: 'YES (Touchscreen Audio)', value: 'true' }, { label: 'NO', value: 'false' }] },
          { id: 'radioDetailsValue', type: 'text', label: 'Radio Accessories Details & Value ETB', required: false, placeholder: 'e.g. Sony Audio System (ETB 45,000)' },
          { id: 'insurePaidDriverAssistant', type: 'dropdown', label: 'Personal Accident (PA) Cover for Paid Driver & Assistant?', required: true, options: [{ label: 'COVERED', value: 'true' }, { label: 'NOT COVERED', value: 'false' }] },
          { id: 'insurePassengersPa', type: 'dropdown', label: 'Personal Accident (PA) Cover for Passengers?', required: true, options: [{ label: 'COVERED (5 Persons)', value: 'true' }, { label: 'NOT COVERED', value: 'false' }] },
        ],
      },
    ];

    const defaultSteps = [
      {
        stepId: 'step_1',
        stepTitle: 'Particulars & Coverage',
        fields: [
          { id: 'full_name', type: 'text', label: 'Full Name / Company Name', required: true, placeholder: 'Enter applicant full name' },
          { id: 'phone_number', type: 'text', label: 'Phone Number', required: true, placeholder: '+251 9...' },
        ],
      },
    ];

    const defaultSchemaJson = JSON.stringify({
      formId: `${productId}_proposal`,
      title: isMotor ? 'Nyala Official Motor Insurance Proposal Form (PDF Standard)' : `${name || productId} Proposal Form`,
      version: '1.0',
      steps: isMotor ? motorSteps : defaultSteps,
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
    selectedFieldId.value = isMotor ? 'proposerAge' : 'full_name';
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
