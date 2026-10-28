<template>
  <div class="form-builder-editor w-full h-[calc(100vh-100px)] rounded-2xl border border-line bg-white text-ink flex flex-col overflow-hidden select-none shadow-sm box-border">
    <!-- Top Navigation Header -->
    <header class="bg-white border-b border-line px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 box-border w-full">
      <div class="flex items-center space-x-3">
        <router-link
          to="/form-builder"
          class="p-1.5 rounded-xl bg-surface-raised hover:bg-line text-ink-muted hover:text-ink transition-colors border border-line shrink-0"
          title="Back to Form Builder Home"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </router-link>

        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-xs sm:text-sm font-bold text-ink capitalize truncate max-w-[200px] sm:max-w-none">{{ productId }} Proposal Form Builder</h2>
            <span
              class="text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border"
              :class="getStatusBadgeClass(store.activeSchema?.status)"
            >
              {{ store.activeSchema?.status || 'Draft' }}
            </span>
          </div>
          <p class="text-[10px] text-ink-subtle font-mono">Schema Version: v{{ store.activeSchema?.version || '1.0' }}</p>
        </div>
      </div>

      <!-- Center Tab Controls -->
      <div class="flex items-center space-x-1 bg-surface-raised p-1 rounded-xl border border-line shrink-0">
        <button
          @click="activeTab = 'editor'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5"
          :class="activeTab === 'editor' ? 'bg-white text-emerald-700 shadow-xs border border-line font-bold' : 'text-ink-muted hover:text-ink'"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          <span>Visual Canvas</span>
        </button>
        <button
          @click="activeTab = 'preview'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5"
          :class="activeTab === 'preview' ? 'bg-white text-emerald-700 shadow-xs border border-line font-bold' : 'text-ink-muted hover:text-ink'"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          <span>Mobile App Preview</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center space-x-2 shrink-0">
        <button
          @click="showHistory = true"
          class="px-2.5 py-1.5 rounded-xl bg-surface-raised hover:bg-line text-ink-muted text-xs font-medium border border-line transition-colors flex items-center space-x-1"
        >
          <svg class="w-3.5 h-3.5 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="hidden sm:inline">Revisions</span>
        </button>

        <button
          @click="handleSave"
          :disabled="store.saving"
          class="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-line text-ink text-xs font-bold border border-line transition-colors flex items-center space-x-1"
        >
          <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          <span>{{ store.saving ? 'Saving...' : 'Save Draft' }}</span>
        </button>

        <button
          @click="handlePublish"
          :disabled="store.saving"
          class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span>Publish Form to Mobile</span>
        </button>
      </div>
    </header>

    <!-- Main Workspace -->
    <div class="flex-1 flex min-h-0 relative overflow-hidden bg-surface-muted/50">
      <!-- Left Field Palette -->
      <FieldPalette
        v-if="activeTab === 'editor'"
        @add-field="onAddField"
      />

      <!-- Middle Main Panel -->
      <div class="flex-1 flex flex-col min-w-0 bg-surface-raised/60 overflow-hidden border-x border-line">
        <!-- Step Manager Bar -->
        <StepManager
          v-if="activeTab === 'editor'"
          :steps="store.activeSteps"
          :selected-index="store.selectedStepIndex"
          @select-step="store.selectedStepIndex = $event"
          @add-step="onAddStep"
          @delete-step="onDeleteStep"
        />

        <!-- Canvas View -->
        <FormCanvas
          v-if="activeTab === 'editor'"
          :step="store.activeStep"
          :selected-field-id="store.selectedFieldId"
          @select-field="store.selectedFieldId = $event"
          @update-step="onStepUpdated"
          @add-field-item="onAddField"
        />

        <!-- Mobile App Simulator View -->
        <MobilePreview
          v-else-if="activeTab === 'preview'"
          :schema-json="store.activeSchema?.schemaJson"
        />
      </div>

      <!-- Right Field Configurator Inspector -->
      <FieldConfigurator
        v-if="activeTab === 'editor'"
        :field="store.selectedField"
        :all-fields="allFormFields"
        @update-field="onStepUpdated"
      />
    </div>

    <!-- Toast Banner -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center space-x-2 animate-bounce"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      <span>{{ toastMessage }}</span>
    </div>

    <!-- Revisions Modal -->
    <FormVersionHistory
      :show="showHistory"
      :product-id="productId"
      :versions="store.schemas"
      @close="showHistory = false"
      @load-version="onLoadVersion"
      @publish-version="onPublishVersion"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useFormBuilderStore } from '../store/formBuilderStore';

import FieldPalette from '../components/FieldPalette.vue';
import StepManager from '../components/StepManager.vue';
import FormCanvas from '../components/FormCanvas.vue';
import FieldConfigurator from '../components/FieldConfigurator.vue';
import JsonPreview from '../components/JsonPreview.vue';
import MobilePreview from '../components/MobilePreview.vue';
import FormVersionHistory from '../components/FormVersionHistory.vue';

const route = useRoute();
const store = useFormBuilderStore();

const productId = computed(() => route.params.productId || 'motor');
const activeTab = ref('editor');
const showHistory = ref(false);
const toastMessage = ref('');

const allFormFields = computed(() => {
  return store.activeSteps.flatMap(s => s.fields || []);
});

onMounted(async () => {
  await store.loadSchemas(productId.value);
  if (store.schemas.length) {
    await store.loadSchema(store.schemas[0].formUuid);
  } else {
    store.initNewSchema(productId.value, productId.value.toUpperCase());
  }
});

function onAddField(item) {
  if (!store.activeStep) return;
  if (!store.activeStep.fields) store.activeStep.fields = [];
  const newFieldId = `${item.type}_${Date.now().toString().slice(-4)}`;
  const newField = {
    id: newFieldId,
    type: item.type,
    label: item.label,
    required: false,
    placeholder: item.type === 'text' || item.type === 'number' ? `Enter ${item.label.toLowerCase()}` : '',
    ...(item.type === 'dropdown' ? { options: [{ label: 'Option 1', value: 'opt_1' }, { label: 'Option 2', value: 'opt_2' }] } : {}),
  };
  store.activeStep.fields.push(newField);
  store.selectedFieldId = newFieldId;
  onStepUpdated();
}

function onAddStep() {
  const steps = [...store.activeSteps];
  steps.push({
    stepId: `step_${steps.length + 1}`,
    stepTitle: `Step ${steps.length + 1}`,
    fields: [],
  });
  store.updateSchemaJson(steps);
  store.selectedStepIndex = steps.length - 1;
}

function onDeleteStep(index) {
  const steps = [...store.activeSteps];
  steps.splice(index, 1);
  store.updateSchemaJson(steps);
  if (store.selectedStepIndex >= steps.length) {
    store.selectedStepIndex = Math.max(0, steps.length - 1);
  }
}

function onStepUpdated() {
  store.updateSchemaJson([...store.activeSteps]);
}

async function handleSave() {
  try {
    await store.saveActiveSchema();
    triggerToast('Draft saved successfully');
  } catch (e) {
    alert('Save failed: ' + e.message);
  }
}

async function handlePublish() {
  try {
    await store.publishActiveSchema();
    triggerToast('Schema published to Mobile App SDUI endpoint!');
  } catch (e) {
    alert('Publish failed: ' + e.message);
  }
}

async function onLoadVersion(verObj) {
  await store.loadSchema(verObj.formUuid);
  showHistory.value = false;
  triggerToast(`Loaded version ${verObj.version}`);
}

async function onPublishVersion(uuid) {
  await store.publishActiveSchema(uuid);
  await store.loadSchemas(productId.value);
  showHistory.value = false;
  triggerToast('Version published successfully');
}

function triggerToast(msg) {
  toastMessage.value = msg;
  setTimeout(() => toastMessage.value = '', 3000);
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'PUBLISHED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'DRAFT': return 'bg-amber-50 text-amber-700 border-amber-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
</script>
