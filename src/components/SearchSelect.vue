<script setup>
import icons from "@/utils/icons";
import Dropdown from "./Dropdown.vue";
import { ref, watch, onMounted } from "vue";
import { usePagination } from "@/composables/usePagination";

const props = defineProps({
  modelValue: {
    type: String,
  },
  placeholder: String,
  searchCb: {
    type: Function,
    required: true,
  },
  selectCb: {
    type: Function,
    default: null,
  },
  option: {
    type: Object,
    required: true,
  },
});

const searchReq = usePagination({
  auto: false,
  cache: false,
  cb: (data) => props.searchCb({ ...data }),
});

const value = ref(props.modelValue || "");
const emit = defineEmits(["update:modelValue"]);
const input = ref(null);
const dropdownToggle = ref(null);
const displayValue = ref("");
const componentId = Math.random().toString(36).substr(2, 9);
const isDropdownOpen = ref(false);

// Global event emitter for closing other dropdowns
const closeOtherDropdowns = (currentId) => {
  window.dispatchEvent(new CustomEvent("closeSearchDropdown", { detail: { id: currentId } }));
};

onMounted(() => {
  const handleCloseOther = (event) => {
    const customEvent = event;
    if (customEvent.detail?.id !== componentId && dropdownToggle.value) {
      dropdownToggle.value(false);
      isDropdownOpen.value = false;
    }
  };

  window.addEventListener("closeSearchDropdown", handleCloseOther);

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!input.value?.contains(event.target) && 
        !event.target.closest?.('.dropdown-wrapper') && 
        isDropdownOpen.value) {
      if (dropdownToggle.value) {
        dropdownToggle.value(false);
        isDropdownOpen.value = false;
      }
    }
  };

  document.addEventListener('click', handleClickOutside);

  return () => {
    window.removeEventListener("closeSearchDropdown", handleCloseOther);
    document.removeEventListener('click', handleClickOutside);
  };
});

watch(value, () => {
  emit("update:modelValue", value.value);
});

watch(
  () => props.modelValue,
  (next) => {
    const v = next || "";
    value.value = v;
    displayValue.value = v;
    if (input.value) {
      input.value.value = v;
    }
  }
);

// Watch search value and trigger API call
watch(() => searchReq.search.value, () => {
  if (searchReq.search.value) {
    searchReq.send();
  }
});

function handleFocus(toggle) {
  if (!toggle) return;
  dropdownToggle.value = toggle; 
  closeOtherDropdowns(componentId);
  toggle(true);
  isDropdownOpen.value = true;
}

function handleBlur(ev, toggle) {
  setTimeout(() => {
    if (!ev.relatedTarget?.closest?.('.dropdown-wrapper') && dropdownToggle.value) {
      dropdownToggle.value(false);
      isDropdownOpen.value = false;
    }
  }, 100);
}

function selectRow(result) {
  const selectedLabel = result[props.option.label];
  value.value = selectedLabel;
  displayValue.value = selectedLabel;
  
  // Update input element directly
  if (input.value) {
    input.value.value = selectedLabel;
  }
  
  // Call callback if provided
  if (props.selectCb) {
    props.selectCb(result);
  }
  
  // Close the dropdown after selection
  if (dropdownToggle.value) {
    dropdownToggle.value(false);
    isDropdownOpen.value = false;
  }
  
  // Clear search after a short delay
  setTimeout(() => {
    searchReq.search.value = "";
  }, 100);
}

function clearSearch() {
  value.value = "";
  displayValue.value = "";
  searchReq.search.value = "";
  searchReq.data.value = [];
  
  if (input.value) {
    input.value.value = "";
    input.value.focus();
  }
  
  // Call callback with null if provided
  if (props.selectCb) {
    props.selectCb(null);
  }
  
  // Keep dropdown open after clearing
  if (dropdownToggle.value) {
    dropdownToggle.value(true);
    isDropdownOpen.value = true;
  }
}

// Handle dropdown toggle from Dropdown component
function handleToggle(state) {
  isDropdownOpen.value = state;
}

// Handle input change
function handleInput(ev) {
  searchReq.search.value = ev.target.value;
  // Show dropdown when typing
  if (ev.target.value && dropdownToggle.value && !isDropdownOpen.value) {
    dropdownToggle.value(true);
    isDropdownOpen.value = true;
  }
}
</script>

<template>
  <div class="search-select-root">
    <Dropdown 
      position="right-bottom" 
      v-slot="{ setRef, toggle }"
      @toggle="handleToggle"
    >
      <!-- Input Container -->
      <div class="search-input-wrapper">
        <div class="search-input-container" :class="{ 'focused': isDropdownOpen }">
          <!-- Search Icon -->
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>

          <!-- Input Field -->
          <input
            ref="input"
            type="text"
            @focus="() => handleFocus(toggle)"
            @input="handleInput"
            @blur="(ev) => handleBlur(ev, toggle)"
            @keydown.esc="() => { 
              if (toggle) { 
                toggle(false); 
                isDropdownOpen = false; 
              }
            }"
            class="search-input"
            :placeholder="placeholder || 'Search...'"
            :value="displayValue || searchReq.search.value"
          />

          <!-- Action Buttons -->
          <div class="search-actions">
            <!-- Loading Spinner -->
            <div v-if="searchReq.pending.value" class="spinner-container">
              <i class="text-blue-500 animate-spin" v-html="icons.spinner" />
            </div>

            <!-- Clear Button -->
            <button
              v-else-if="searchReq.search.value || value"
              @click.prevent.stop="clearSearch"
              class="clear-button"
              type="button"
              aria-label="Clear search"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Dropdown Results -->
      <div 
        v-if="isDropdownOpen" 
        :ref="setRef" 
        class="dropdown-wrapper"
      >
        <div class="dropdown-container">
          <!-- Loading State -->
          <div v-if="searchReq.pending.value" class="loading-state">
            <div class="loading-spinner">
              <i class="animate-spin" v-html="icons.spinner" />
            </div>
            <p class="loading-text">Searching...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!searchReq.data.value?.length" class="empty-state">
            <div class="empty-state-content">
              <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <p class="empty-text">
                {{ !searchReq.dirty.value ? "Type to search..." : "No results found" }}
              </p>
            </div>
          </div>

          <!-- Results List -->
          <div v-else class="results-list">
            <slot name="searchResult" :result="searchReq.data.value" :onSelect="selectRow">
              <div
                v-for="(result, idx) in searchReq.data.value"
                :key="result[option.value] || idx"
                @click="selectRow(result)"
                @keydown.enter="selectRow(result)"
                tabindex="0"
                class="result-item"
                role="option"
              >
                <!-- Avatar -->
                <div class="result-avatar">
                  <i v-html="icons.provider" />
                </div>

                <!-- Content -->
                <div class="result-content">
                  <p class="result-title">{{ result[option.label] }}</p>
                  <p v-if="result.email || result.telephone" class="result-subtitle">
                    {{ result.email || result.telephone }}
                  </p>
                </div>

                <!-- Chevron -->
                <svg class="result-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </Dropdown>
  </div>
</template>

<style scoped>
/* ========== ROOT ========== */
.search-select-root {
  position: relative;
  width: 100%;
}

/* ========== INPUT WRAPPER ========== */
.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1.5px solid #e0e7ff;
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.search-input-container:hover {
  border-color: #c7d2fe;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.search-input-container.focused,
.search-input-container:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Search Icon */
.search-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #9ca3af;
  pointer-events: none;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.search-input-container.focused .search-icon,
.search-input-container:focus-within .search-icon {
  color: #6366f1;
}

/* Input Field */
.search-input {
  flex: 1;
  width: 100%;
  padding: 10px 12px 10px 40px;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  background: transparent;
  border: none;
  outline: none;
  font-family: inherit;
  height: 40px;
  box-sizing: border-box;
}

.search-input::placeholder {
  color: #d1d5db;
  font-weight: 400;
}

/* Action Buttons */
.search-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 10px;
  gap: 4px;
}

.spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #6366f1;
}

.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: #9ca3af;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clear-button:hover {
  color: #6b7280;
  background: #f3f4f6;
}

.clear-button:active {
  background: #e5e7eb;
}

/* ========== DROPDOWN ========== */
.dropdown-wrapper {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  width: 100%;
  z-index: 9999;
}

.dropdown-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  min-height: 160px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #6366f1;
  margin-bottom: 12px;
}

.loading-text {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  min-height: 160px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.empty-state-content {
  text-align: center;
}

.empty-icon {
  width: 56px;
  height: 56px;
  color: #cbd5e1;
  margin: 0 auto 16px;
  opacity: 0.7;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.4;
  }
}

.empty-text {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* Results List */
.results-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 200px);
  min-height: auto;
}

/* Result Item */
.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid #f1f5f9;
  outline: none;
  position: relative;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: linear-gradient(90deg, #f0f9ff 0%, #f8fafc 100%);
  padding-left: 20px;
}

.result-item:focus {
  background: #eff6ff;
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.result-item:active {
  background: #dbeafe;
}

/* Result Avatar */
.result-avatar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 10px;
  color: #0284c7;
  font-size: 18px;
  transition: all 0.2s ease;
}

.result-item:hover .result-avatar {
  background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
  transform: scale(1.05);
}

/* Result Content */
.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.2px;
}

.result-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 3px 0 0 0;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Result Chevron */
.result-chevron {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  color: #cbd5e1;
  transition: all 0.2s ease;
  opacity: 0;
}

.result-item:hover .result-chevron {
  color: #0284c7;
  opacity: 1;
  transform: translateX(4px);
}

/* ========== SCROLLBAR ========== */
.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: transparent;
}

.results-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Firefox Scrollbar */
.results-list {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 640px) {
  .search-input {
    padding: 12px 16px 12px 44px;
    font-size: 16px;
    height: 48px;
  }

  .search-icon {
    left: 16px;
    width: 20px;
    height: 20px;
  }

  .search-actions {
    padding-right: 12px;
  }

  .results-list {
    max-height: calc(100vh - 250px);
  }

  .result-item {
    padding: 12px 14px;
    gap: 10px;
  }

  .result-item:hover {
    padding-left: 16px;
  }

  .result-avatar {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .result-title {
    font-size: 13px;
  }

  .result-subtitle {
    font-size: 11px;
  }

  .empty-state,
  .loading-state {
    padding: 40px 24px;
    min-height: 140px;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
  }
}
</style>