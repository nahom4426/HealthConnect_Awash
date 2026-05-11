<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  // For v-model support
  modelValue: {
    type: [Boolean, String, Number],
    default: false
  },
  // Legacy prop support
  value: {
    type: [Boolean, String, Number],
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

console.log(`Toggle [${props.name}] received value:`, props.value, 'modelValue:', props.modelValue);

const emit = defineEmits(['update:modelValue', 'change']);

const isChecked = ref(false);
const inputEl = ref(null);

// Helper function to convert various input types to boolean
const convertToBoolean = (value) => {
  console.log(`Converting value for ${props.name}:`, value, typeof value);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lowerVal = value.toLowerCase().trim();
    if (lowerVal === 'true' || lowerVal === '1' || lowerVal === 'on' || lowerVal === 'yes') return true;
    if (lowerVal === 'false' || lowerVal === '0' || lowerVal === 'off' || lowerVal === 'no') return false;
  }
  return Boolean(value);
};

// Get the active value (prefer modelValue, fall back to value)
const getActiveValue = () => {
  const value = props.modelValue !== undefined ? props.modelValue : props.value;
  console.log(`getActiveValue for ${props.name}:`, value);
  return value;
};

// Initialize checked state
const initializeState = () => {
  const activeValue = getActiveValue();
  const booleanValue = convertToBoolean(activeValue);
  console.log(`Initializing ${props.name} with:`, activeValue, '-> boolean:', booleanValue);
  isChecked.value = booleanValue;
  
  if (inputEl.value) {
    inputEl.value.checked = booleanValue;
    // Set data attributes for form validation system
    inputEl.value.dataset['valid'] = 'true';
    inputEl.value.dataset['val'] = JSON.stringify({ value: booleanValue });
    console.log(`Set DOM element for ${props.name}:`, inputEl.value.checked, inputEl.value.dataset['val']);
  }
};

// Use nextTick to ensure DOM is ready
onMounted(() => {
  console.log(`Toggle ${props.name} mounted`);
  nextTick(() => {
    initializeState();
  });
});

// Immediate watch to catch initial value changes
watch(() => getActiveValue(), (newVal) => {
  console.log(`Watch triggered for ${props.name}:`, newVal);
  initializeState();
}, { immediate: true });

// Computed class for toggle background
const toggleBgClass = computed(() => {
  if (props.disabled) {
    return isChecked.value ? 'bg-blue-400' : 'bg-gray-200';
  }
  return isChecked.value ? 'bg-blue-600' : 'bg-gray-300';
});

// Computed class for cursor
const cursorClass = computed(() => {
  return props.disabled ? 'cursor-not-allowed' : 'cursor-pointer';
});

// Handle input change event
const handleInputChange = (e) => {
  const newValue = e.target.checked;
  console.log(`Input change for ${props.name}:`, newValue);
  isChecked.value = newValue;
  
  // Update data attributes for form validation system
  if (inputEl.value) {
    inputEl.value.dataset['valid'] = 'true';
    inputEl.value.dataset['val'] = JSON.stringify({ value: newValue });
  }
  
  emit('update:modelValue', newValue);
  emit('change', newValue);
};

// Handle toggle click
const handleToggle = () => {
  if (props.disabled) return;
  
  const newValue = !isChecked.value;
  console.log(`Toggle clicked for ${props.name}:`, newValue);
  isChecked.value = newValue;
  
  // Update data attributes for form validation system
  if (inputEl.value) {
    inputEl.value.checked = newValue;
    inputEl.value.dataset['valid'] = 'true';
    inputEl.value.dataset['val'] = JSON.stringify({ value: newValue });
  }
  
  // Emit Vue events
  emit('update:modelValue', newValue);
  emit('change', newValue);
  
  // Trigger native event for form submission
  if (inputEl.value) {
    const event = new Event('change', { bubbles: true });
    inputEl.value.dispatchEvent(event);
  }
};

// Set ref
const setRef = (el) => {
  inputEl.value = el;
  if (el) {
    console.log(`DOM element set for ${props.name}, initializing...`);
    initializeState();
  }
};
</script>

<template>
  <div class="toggle-wrapper">
    <!-- Hidden checkbox for form submission -->
    <input
      :ref="setRef"
      type="checkbox"
      :id="name"
      :name="name"
      :disabled="disabled"
      :checked="isChecked"
      :value="isChecked ? 'true' : 'false'"
      class="sr-only custom-input"
      @change="handleInputChange"
    />
    
    <div class="flex gap-3 items-center">
      <div class="inline-flex relative items-center">
        <!-- Toggle switch -->
        <div 
          :id="`toggle-${name}`"
          role="switch"
          :aria-checked="isChecked"
          :aria-label="label || 'Toggle switch'"
          :aria-describedby="description ? `desc-${name}` : undefined"
          :tabindex="disabled ? -1 : 0"
          :class="[
            'w-11 h-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-200',
            toggleBgClass,
            cursorClass,
            { 'opacity-60': disabled }
          ]"
          @click="handleToggle"
          @keydown.space.prevent="handleToggle"
          @keydown.enter.prevent="handleToggle"
        >
          <!-- Toggle knob -->
          <div 
            :class="[
              'absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all duration-200',
              { 'transform translate-x-full': isChecked }
            ]"
          ></div>
        </div>
      </div>
      
      <!-- Label and description -->
      <div v-if="label || description" class="flex flex-col">
        <label 
          :for="name" 
          :class="[
            'text-sm font-medium select-none',
            disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 cursor-pointer'
          ]"
          @click="handleToggle"
        >
          {{ label }}
        </label>
        <span 
          v-if="description" 
          :id="`desc-${name}`"
          :class="[
            'text-xs select-none',
            disabled ? 'text-gray-400' : 'text-gray-500'
          ]"
        >
          {{ description }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toggle-wrapper {
  position: relative;
}

/* Accessibility improvements */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Improve focus visibility */
[role="switch"]:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
</style>