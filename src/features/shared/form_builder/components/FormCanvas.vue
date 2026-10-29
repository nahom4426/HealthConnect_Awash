<template>
  <div
    class="form-canvas flex-1 bg-surface-muted/80 p-4 sm:p-6 overflow-y-auto min-h-0 relative box-border"
    @dragover.prevent="isDraggingOver = true"
    @dragleave="isDraggingOver = false"
    @drop.prevent="onDrop"
  >
    <div v-if="step" class="max-w-2xl mx-auto space-y-4 box-border">
      <!-- Step Header Card -->
      <div class="bg-white border border-line rounded-2xl p-4 sm:p-5 shadow-xs box-border overflow-hidden">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">Step Details</span>
          <span class="text-xs text-ink-subtle font-medium">{{ step.fields?.length || 0 }} fields</span>
        </div>
        <input
          v-model="step.stepTitle"
          type="text"
          placeholder="Step Title (e.g. Particulars of Risk)"
          class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-subtle focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors font-bold"
          @input="emitUpdate"
        />
      </div>

      <!-- Dragover Highlight Overlay -->
      <div
        v-if="isDraggingOver"
        class="border-2 border-dashed border-emerald-500 bg-emerald-50 rounded-2xl p-6 text-center text-emerald-700 font-bold text-xs animate-pulse box-border"
      >
        Drop new field here
      </div>

      <!-- Fields List -->
      <div v-if="step.fields && step.fields.length" class="space-y-3 box-border">
        <div
          v-for="(field, index) in step.fields"
          :key="field.id"
          @click="selectField(field.id)"
          class="field-card group relative bg-white border rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs box-border overflow-hidden"
          :class="[
            selectedFieldId === field.id
              ? 'border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
              : 'border-line hover:border-line-strong hover:bg-surface-muted/60'
          ]"
        >
          <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div class="flex items-center space-x-2 flex-wrap gap-1">
              <span class="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md border" :class="getTypeBadgeClass(field.type)">
                {{ field.type }}
              </span>
              <span v-if="field.required" class="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Required
              </span>
              <span v-if="field.condition" class="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 flex items-center space-x-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Conditional</span>
              </span>
            </div>

            <!-- Action Controls -->
            <div class="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
              <button
                v-if="index > 0"
                @click.stop="moveField(index, -1)"
                class="p-1 text-ink-subtle hover:text-ink rounded hover:bg-surface-raised"
                title="Move up"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                v-if="index < step.fields.length - 1"
                @click.stop="moveField(index, 1)"
                class="p-1 text-ink-subtle hover:text-ink rounded hover:bg-surface-raised"
                title="Move down"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                @click.stop="deleteField(index)"
                class="p-1 text-ink-subtle hover:text-rose-600 rounded hover:bg-rose-50"
                title="Delete field"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Field Canvas Mock Display -->
          <div class="space-y-1.5 box-border">
            <label class="block text-xs font-bold text-ink">
              {{ field.label || 'Untitled Field' }}
            </label>
            <p v-if="field.helpText" class="text-[11px] text-ink-subtle">{{ field.helpText }}</p>

            <div v-if="field.type === 'header'" class="border-t border-line pt-2 text-ink-subtle text-xs italic">
              Section Header Divider
            </div>

            <div v-else-if="field.type === 'text' || field.type === 'number'" class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-3 py-2 text-xs text-ink-subtle pointer-events-none">
              {{ field.placeholder || 'User input placeholder...' }}
            </div>

            <div v-else-if="field.type === 'dropdown'" class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-3 py-2 text-xs text-ink-subtle flex justify-between items-center pointer-events-none">
              <span>{{ field.options && field.options.length ? `${field.options.length} options configured` : 'Select option...' }}</span>
              <svg class="w-4 h-4 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>

            <div v-else-if="field.type === 'date'" class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-3 py-2 text-xs text-ink-subtle flex justify-between items-center pointer-events-none">
              <span>DD / MM / YYYY</span>
              <svg class="w-4 h-4 text-ink-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>

            <div v-else-if="field.type === 'toggle' || field.type === 'boolean'" class="flex items-center space-x-3 pt-1 pointer-events-none">
              <div class="w-10 h-6 bg-line rounded-full p-1 flex items-center">
                <div class="w-4 h-4 bg-white rounded-full shadow-xs"></div>
              </div>
              <span class="text-xs text-ink-subtle">Yes / No Switch</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="bg-white border-2 border-dashed border-line rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3"
      >
        <div class="w-12 h-12 rounded-2xl bg-surface-raised flex items-center justify-center text-ink-subtle">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 class="text-sm font-bold text-ink-muted">No fields in this step</h4>
          <p class="text-xs text-ink-subtle mt-1">Drag fields from the left palette or click a field to add</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  step: { type: Object, default: null },
  selectedFieldId: { type: String, default: null },
});

const emit = defineEmits(['select-field', 'update-step', 'add-field-item']);

const isDraggingOver = ref(false);

function selectField(id) {
  emit('select-field', id);
}

function emitUpdate() {
  emit('update-step');
}

function moveField(index, direction) {
  if (!props.step || !props.step.fields) return;
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= props.step.fields.length) return;
  const temp = props.step.fields[index];
  props.step.fields[index] = props.step.fields[targetIdx];
  props.step.fields[targetIdx] = temp;
  emitUpdate();
}

function deleteField(index) {
  if (!props.step || !props.step.fields) return;
  props.step.fields.splice(index, 1);
  emitUpdate();
}

function onDrop(event) {
  isDraggingOver.value = false;
  try {
    const raw = event.dataTransfer.getData('application/json');
    if (raw) {
      const item = JSON.parse(raw);
      emit('add-field-item', item);
    }
  } catch (e) {
    console.error(e);
  }
}

function getTypeBadgeClass(type) {
  switch (type) {
    case 'text': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'number': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'dropdown': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'date': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'toggle': return 'bg-teal-50 text-teal-700 border-teal-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
</script>
