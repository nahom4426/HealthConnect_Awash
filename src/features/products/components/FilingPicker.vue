<script setup>
import { computed } from 'vue';

// Category → class of business for one product, or unfiled. The model is { categoryKey, subcategoryKey };
// both empty means unfiled. Subcategory keys repeat across categories, so they are always picked
// within a category and sent together.
const props = defineProps({
  modelValue: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const byOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

// Active nodes, plus the current one if it has since been retired, so an existing filing still shows
const categoryOptions = computed(() =>
  props.categories.filter((c) => c.status !== 'RETIRED' || c.key === props.modelValue.categoryKey).slice().sort(byOrder),
);
const chosenCategory = computed(() => props.categories.find((c) => c.key === props.modelValue.categoryKey) || null);
const subcategoryOptions = computed(() =>
  (chosenCategory.value?.subcategories || [])
    .filter((s) => s.status !== 'RETIRED' || s.key === props.modelValue.subcategoryKey)
    .slice()
    .sort(byOrder),
);

function setCategory(categoryKey) {
  const subs = props.categories.find((c) => c.key === categoryKey)?.subcategories?.filter((s) => s.status !== 'RETIRED') || [];
  emit('update:modelValue', { categoryKey, subcategoryKey: subs.length === 1 ? subs[0].key : '' });
}

function setSubcategory(subcategoryKey) {
  emit('update:modelValue', { categoryKey: props.modelValue.categoryKey, subcategoryKey });
}
</script>

<template>
  <div class="pp-grid span-2">
    <label class="pp-field" :class="{ invalid: error }">
      Category
      <select :value="modelValue.categoryKey" :disabled="disabled" @change="setCategory($event.target.value)">
        <option value="">Unfiled</option>
        <option v-for="c in categoryOptions" :key="c.key" :value="c.key">{{ c.name }}{{ c.status === 'RETIRED' ? ' (retired)' : '' }}</option>
      </select>
    </label>
    <label class="pp-field" :class="{ invalid: error }">
      Class of business
      <select
        :value="modelValue.subcategoryKey"
        :disabled="disabled || !modelValue.categoryKey || !subcategoryOptions.length"
        @change="setSubcategory($event.target.value)"
      >
        <option value="">{{ !modelValue.categoryKey ? '—' : subcategoryOptions.length ? 'Choose…' : 'None in this category yet' }}</option>
        <option v-for="s in subcategoryOptions" :key="s.key" :value="s.key">{{ s.name }}{{ s.status === 'RETIRED' ? ' (retired)' : '' }}</option>
      </select>
    </label>
    <small class="span-2 muted" style="margin-top: -.4rem">
      For browsing only. It doesn't change the product's family or permissions.
    </small>
    <span v-if="error" class="field-error span-2">{{ error }}</span>
  </div>
</template>
