<template>
  <div class="field-configurator bg-white border-l border-line p-5 w-80 flex flex-col h-full overflow-y-auto select-none custom-scrollbar shrink-0 box-border">
    <div v-if="field" class="space-y-5">
      <div class="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h3 class="text-sm font-bold text-ink">Field Settings</h3>
          <p class="text-[11px] text-ink-subtle font-mono">ID: {{ field.id }}</p>
        </div>
        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          {{ field.type }}
        </span>
      </div>

      <!-- General Properties -->
      <div class="space-y-3 box-border">
        <div>
          <label class="block text-xs font-bold text-ink-muted mb-1">Field Key (ID)</label>
          <input
            v-model="field.id"
            type="text"
            class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-emerald-500 focus:bg-white font-mono"
            @input="emitUpdate"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-ink-muted mb-1">Label Text</label>
          <input
            v-model="field.label"
            type="text"
            placeholder="Field label for user"
            class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-emerald-500 focus:bg-white"
            @input="emitUpdate"
          />
        </div>

        <div v-if="field.type !== 'header' && field.type !== 'toggle'">
          <label class="block text-xs font-bold text-ink-muted mb-1">Placeholder Text</label>
          <input
            v-model="field.placeholder"
            type="text"
            placeholder="Input placeholder..."
            class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-emerald-500 focus:bg-white"
            @input="emitUpdate"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-ink-muted mb-1">Help Text / Description</label>
          <input
            v-model="field.helpText"
            type="text"
            placeholder="Subtext shown under field"
            class="w-full max-w-full box-border bg-surface-muted border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-emerald-500 focus:bg-white"
            @input="emitUpdate"
          />
        </div>
      </div>

      <!-- Validations -->
      <div v-if="field.type !== 'header'" class="space-y-3 pt-3 border-t border-line">
        <h4 class="text-xs font-bold text-ink-subtle uppercase tracking-wider">Validations</h4>

        <label class="flex items-center space-x-2.5 cursor-pointer">
          <input
            v-model="field.required"
            type="checkbox"
            class="rounded border-line-strong text-emerald-600 focus:ring-emerald-500"
            @change="emitUpdate"
          />
          <span class="text-xs font-bold text-ink">Required Field</span>
        </label>
      </div>

      <!-- Dropdown Options Configurator -->
      <div v-if="field.type === 'dropdown'" class="space-y-3 pt-3 border-t border-line">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-ink-subtle uppercase tracking-wider">Dropdown Options</h4>
          <button @click="addOption" class="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">+ Add Option</button>
        </div>

        <div class="space-y-2">
          <div
            v-for="(opt, idx) in optionsList"
            :key="idx"
            class="flex items-center space-x-2 bg-surface-muted p-2 rounded-xl border border-line"
          >
            <input
              v-model="opt.label"
              type="text"
              placeholder="Option Label"
              class="w-1/2 bg-white border border-line rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:border-emerald-500"
              @input="updateOptions"
            />
            <input
              v-model="opt.value"
              type="text"
              placeholder="Value"
              class="w-1/2 bg-white border border-line rounded-lg px-2 py-1 text-xs text-ink focus:outline-none focus:border-emerald-500 font-mono"
              @input="updateOptions"
            />
            <button @click="removeOption(idx)" class="text-ink-subtle hover:text-rose-600 p-1">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Conditional Visibility Rules -->
      <div class="pt-3 border-t border-line">
        <ConditionalRuleEditor
          v-model="field.condition"
          :all-fields="allFields"
          :current-field-id="field.id"
          @update:model-value="emitUpdate"
        />
      </div>
    </div>

    <!-- Empty Inspector -->
    <div v-else class="h-full flex flex-col items-center justify-center text-center p-4 text-ink-subtle space-y-2">
      <svg class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p class="text-xs font-medium">Click any field in the canvas to configure its properties</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import ConditionalRuleEditor from './ConditionalRuleEditor.vue';

const props = defineProps({
  field: { type: Object, default: null },
  allFields: { type: Array, default: () => [] },
});

const emit = defineEmits(['update-field']);

const optionsList = ref([]);

watch(() => props.field, (newField) => {
  if (newField && newField.options) {
    optionsList.value = newField.options.map(o => typeof o === 'string' ? { label: o, value: o } : { ...o });
  } else {
    optionsList.value = [];
  }
}, { immediate: true });

function addOption() {
  optionsList.value.push({ label: `Option ${optionsList.value.length + 1}`, value: `opt_${optionsList.value.length + 1}` });
  updateOptions();
}

function removeOption(idx) {
  optionsList.value.splice(idx, 1);
  updateOptions();
}

function updateOptions() {
  if (props.field) {
    props.field.options = optionsList.value.map(o => ({ label: o.label, value: o.value }));
    emitUpdate();
  }
}

function emitUpdate() {
  emit('update-field');
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
</style>
