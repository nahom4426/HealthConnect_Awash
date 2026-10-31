<template>
  <div class="mobile-preview flex-1 bg-surface-muted/60 p-4 sm:p-6 flex flex-col md:flex-row items-center md:items-start justify-center gap-6 min-h-0 select-none overflow-y-auto custom-scrollbar box-border w-full h-full">
    
    <!-- Sidebar Control Panel -->
    <div class="w-full md:w-60 bg-white p-4 rounded-2xl border border-line shadow-xs shrink-0 space-y-4 box-border overflow-hidden">
      <div>
        <div class="flex items-center space-x-2 text-emerald-700 mb-1">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 class="text-xs font-bold uppercase tracking-wider text-ink">Device Simulator</h3>
        </div>
        <p class="text-[11px] text-ink-subtle leading-relaxed">Select target mobile device to preview exact screen layout.</p>
      </div>

      <!-- Preset Selector List -->
      <div class="space-y-1.5 pt-2 border-t border-line box-border">
        <label class="block text-[10px] font-bold uppercase tracking-wider text-ink-subtle">Target Preset</label>
        <div class="space-y-1.5 box-border">
          <button
            v-for="d in devices"
            :key="d.id"
            @click="selectedDevice = d"
            class="w-full max-w-full box-border text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between border"
            :class="selectedDevice.id === d.id ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-bold' : 'bg-surface-muted text-ink-muted border-line hover:bg-surface-raised hover:text-ink'"
          >
            <span class="truncate mr-2">{{ d.name }}</span>
            <span class="text-[10px] font-mono text-ink-subtle shrink-0">{{ d.width }}×{{ d.height }}</span>
          </button>
        </div>
      </div>

      <!-- Info Badge -->
      <div class="pt-3 border-t border-line text-[10px] text-ink-subtle flex items-center space-x-1.5">
        <svg class="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Renders live form field inputs & rules</span>
      </div>
    </div>

    <!-- Smartphone Mockup Outer Container -->
    <div
      class="bg-slate-950 border-[8px] border-slate-900 rounded-[44px] shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300 ring-1 ring-slate-400/40 shrink-0 my-auto"
      :style="{ width: `${selectedDevice.width}px`, height: `${selectedDevice.height}px` }"
    >
      <!-- Notch / Camera Punch Hole / Dynamic Island -->
      <div class="w-full bg-slate-950 h-7 flex items-center justify-between px-5 shrink-0 relative z-20">
        <!-- Clock -->
        <span class="text-[10px] font-semibold text-slate-300 font-mono">09:41</span>

        <!-- Center Camera Notch -->
        <div v-if="selectedDevice.notch === 'dynamic-island'" class="w-20 h-3.5 bg-black rounded-full flex items-center justify-end px-1.5 border border-slate-800 shadow-inner">
          <div class="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700 mr-1"></div>
          <div class="w-2 h-2 rounded-full bg-emerald-950/80 border border-emerald-600/40"></div>
        </div>
        <div v-else-if="selectedDevice.notch === 'punch-hole'" class="w-3 h-3 bg-black rounded-full border border-slate-800 shadow-inner"></div>
        <div v-else class="w-16 h-2.5 bg-slate-900 rounded-b-xl border border-slate-800"></div>

        <!-- Status Icons (5G, Wifi, Battery) -->
        <div class="flex items-center space-x-1 text-slate-300 text-[9px]">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.3A.996.996 0 005.06 20h13.88c.38 0 .73-.21.89-.55.17-.35.11-.76-.14-1.04l-.62-.7C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 14.5c-3.03 0-5.5-2.47-5.5-5.5S8.97 6.5 12 6.5s5.5 2.47 5.5 5.5-2.47 5.5-5.5 5.5z"/></svg>
          <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4z"/></svg>
          <div class="w-4 h-2 border border-line-strong rounded-2xs p-0.5 flex items-center">
            <div class="w-full h-full bg-emerald-400 rounded-2xs"></div>
          </div>
        </div>
      </div>

      <!-- Mobile App Navigation Header -->
      <div class="bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-2.5 text-white flex items-center justify-between shrink-0 shadow-md">
        <div class="flex items-center space-x-1.5">
          <button class="p-0.5 rounded-full hover:bg-white/10 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <span class="text-xs font-bold block truncate max-w-[130px]">{{ schemaTitle || 'Proposal Form' }}</span>
            <span class="text-[9px] text-emerald-100 block opacity-90 leading-tight">Standard Digital Channel</span>
          </div>
        </div>
        <span class="text-[9px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-bold">Step {{ activeStepIndex + 1 }}/{{ steps.length }}</span>
      </div>

      <!-- Mobile Step Indicators -->
      <div v-if="steps.length > 1" class="bg-surface-raised border-b border-line px-3.5 py-1.5 flex items-center space-x-1 shrink-0 overflow-x-auto">
        <div
          v-for="(s, idx) in steps"
          :key="idx"
          @click="activeStepIndex = idx"
          class="h-1 flex-1 rounded-full cursor-pointer transition-all"
          :class="idx === activeStepIndex ? 'bg-emerald-600 shadow-xs' : 'bg-slate-300'"
        ></div>
      </div>

      <!-- Mobile Form Screen Body -->
      <div class="flex-1 bg-white p-3.5 overflow-y-auto space-y-3 custom-scrollbar text-left">
        <div v-if="currentStep">
          <div class="mb-2.5 border-b border-line pb-1.5">
            <h4 class="text-xs font-bold text-ink">{{ currentStep.stepTitle || `Step ${activeStepIndex + 1}` }}</h4>
            <p class="text-[10px] text-ink-subtle mt-0.5">Please provide accurate insurance details</p>
          </div>

          <div class="space-y-3">
            <div
              v-for="field in visibleFields"
              :key="field.id"
              class="space-y-1"
            >
              <!-- Label -->
              <label class="block text-[11px] font-bold text-ink">
                {{ field.label }}
                <span v-if="field.required" class="text-rose-500">*</span>
              </label>

              <!-- Header Field -->
              <div v-if="field.type === 'header'" class="pt-1.5 border-b border-line text-xs font-bold text-emerald-700">
                {{ field.label }}
              </div>

              <!-- Text / Number Input -->
              <input
                v-else-if="field.type === 'text' || field.type === 'number'"
                v-model="formValues[field.id]"
                :type="field.type === 'number' ? 'number' : 'text'"
                :placeholder="field.placeholder || 'Enter value'"
                class="w-full bg-surface-muted border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink placeholder-ink-subtle focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />

              <!-- Dropdown -->
              <select
                v-else-if="field.type === 'dropdown'"
                v-model="formValues[field.id]"
                class="w-full bg-surface-muted border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              >
                <option value="" disabled>Select option...</option>
                <option v-for="(opt, oIdx) in field.options" :key="oIdx" :value="opt.value || opt">
                  {{ opt.label || opt }}
                </option>
              </select>

              <!-- Date Picker -->
              <input
                v-else-if="field.type === 'date'"
                v-model="formValues[field.id]"
                type="date"
                class="w-full bg-surface-muted border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />

              <!-- Toggle Switch -->
              <div v-else-if="field.type === 'toggle'" class="flex items-center justify-between bg-surface-muted border border-line rounded-lg px-3 py-1.5">
                <span class="text-[11px] font-semibold text-ink">{{ formValues[field.id] ? 'Yes / Enabled' : 'No / Disabled' }}</span>
                <button
                  @click="formValues[field.id] = !formValues[field.id]"
                  class="w-9 h-5 rounded-full p-0.5 transition-colors"
                  :class="formValues[field.id] ? 'bg-emerald-600' : 'bg-slate-300'"
                >
                  <div
                    class="w-4 h-4 rounded-full bg-white shadow-md transition-transform"
                    :class="formValues[field.id] ? 'translate-x-4' : 'translate-x-0'"
                  ></div>
                </button>
              </div>

              <p v-if="field.helpText" class="text-[9px] text-ink-subtle">{{ field.helpText }}</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10 text-xs text-ink-subtle font-medium">
          No fields in this step
        </div>
      </div>

      <!-- Mobile Footer Action Bar -->
      <div class="bg-white border-t border-line p-2.5 flex items-center justify-between shrink-0 shadow-lg">
        <button
          v-if="activeStepIndex > 0"
          @click="activeStepIndex--"
          class="px-3 py-1.5 rounded-lg bg-surface-raised text-ink-muted text-[11px] font-bold hover:bg-line transition-colors"
        >
          Previous
        </button>
        <div v-else></div>

        <button
          v-if="activeStepIndex < steps.length - 1"
          @click="activeStepIndex++"
          class="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
        >
          Next Step
        </button>
        <button
          v-else
          class="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold shadow-xs shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
        >
          Submit Proposal
        </button>
      </div>

      <!-- Bottom Home Bar Indicator -->
      <div class="bg-slate-950 pb-1 pt-0.5 flex justify-center shrink-0">
        <div class="w-24 h-1 bg-slate-700 rounded-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';

const props = defineProps({
  schemaJson: { type: [String, Object], default: '' },
});

const devices = [
  { id: 'iphone15', name: 'iPhone 15 Pro', width: 310, height: 560, notch: 'dynamic-island' },
  { id: 'galaxy', name: 'Samsung Galaxy S24', width: 300, height: 540, notch: 'punch-hole' },
  { id: 'pixel', name: 'Google Pixel 8', width: 320, height: 570, notch: 'punch-hole' },
  { id: 'compact', name: 'iPhone SE', width: 280, height: 500, notch: 'classic' },
];

const selectedDevice = ref(devices[0]);
const activeStepIndex = ref(0);
const formValues = reactive({});

const schemaObj = computed(() => {
  if (!props.schemaJson) return {};
  try {
    return typeof props.schemaJson === 'string' ? JSON.parse(props.schemaJson) : props.schemaJson;
  } catch {
    return {};
  }
});

const schemaTitle = computed(() => schemaObj.value.title || 'Proposal Form');
const steps = computed(() => schemaObj.value.steps || []);
const currentStep = computed(() => steps.value[activeStepIndex.value] || null);

// Conditional visibility evaluation
const visibleFields = computed(() => {
  if (!currentStep.value || !currentStep.value.fields) return [];
  return currentStep.value.fields.filter(field => {
    if (!field.condition || !field.condition.field) return true;
    const targetVal = formValues[field.condition.field];
    const expected = field.condition.value;
    if (field.condition.operator === 'equals') {
      return String(targetVal) === String(expected);
    }
    if (field.condition.operator === 'not_equals') {
      return String(targetVal) !== String(expected);
    }
    if (field.condition.operator === 'contains') {
      return String(targetVal || '').includes(String(expected));
    }
    return true;
  });
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
</style>
