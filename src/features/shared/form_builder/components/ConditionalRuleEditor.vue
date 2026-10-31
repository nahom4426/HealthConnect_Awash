<template>
  <div class="conditional-rule-editor bg-surface-muted border border-line rounded-xl p-3 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-1.5 text-xs font-bold text-cyan-700">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>Conditional Visibility Rule</span>
      </div>
      <button
        v-if="condition"
        @click="clearCondition"
        class="text-[10px] text-rose-600 hover:text-rose-700 font-bold"
      >
        Clear Rule
      </button>
    </div>

    <div v-if="!condition" class="text-[11px] text-ink-subtle">
      Field is always visible. Add a rule to show it only when another field has a specific value.
      <button
        @click="initCondition"
        class="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 block"
      >
        + Add Visibility Rule
      </button>
    </div>

    <div v-else class="space-y-2 text-xs">
      <div>
        <label class="block text-[10px] text-ink-subtle uppercase tracking-wider mb-1 font-bold">Show when field</label>
        <select
          v-model="condition.field"
          class="w-full bg-white border border-line rounded-lg px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-cyan-500 font-medium"
          @change="emitUpdate"
        >
          <option value="" disabled>Select target field...</option>
          <option v-for="f in availableFields" :key="f.id" :value="f.id">
            {{ f.label || f.id }} ({{ f.type }})
          </option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-[10px] text-ink-subtle uppercase tracking-wider mb-1 font-bold">Operator</label>
          <select
            v-model="condition.operator"
            class="w-full bg-white border border-line rounded-lg px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-cyan-500 font-medium"
            @change="emitUpdate"
          >
            <option value="equals">Equals (==)</option>
            <option value="not_equals">Not Equals (!=)</option>
            <option value="contains">Contains</option>
          </select>
        </div>

        <div>
          <label class="block text-[10px] text-ink-subtle uppercase tracking-wider mb-1 font-bold">Target Value</label>
          <input
            v-model="condition.value"
            type="text"
            placeholder="e.g. true, Commercial"
            class="w-full bg-white border border-line rounded-lg px-2.5 py-1.5 text-ink text-xs focus:outline-none focus:border-cyan-500 font-mono"
            @input="emitUpdate"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Object, default: null },
  allFields: { type: Array, default: () => [] },
  currentFieldId: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);

const condition = ref(props.modelValue ? { ...props.modelValue } : null);

const availableFields = ref([]);

watch(() => props.allFields, (newFields) => {
  availableFields.value = (newFields || []).filter(f => f.id !== props.currentFieldId);
}, { immediate: true });

watch(() => props.modelValue, (newVal) => {
  condition.value = newVal ? { ...newVal } : null;
});

function initCondition() {
  condition.value = {
    field: availableFields.value.length ? availableFields.value[0].id : '',
    operator: 'equals',
    value: 'true',
  };
  emitUpdate();
}

function clearCondition() {
  condition.value = null;
  emit('update:modelValue', null);
}

function emitUpdate() {
  emit('update:modelValue', condition.value);
}
</script>
