<script setup lang="ts">
import icons from "@/utils/icons";
import Dropdown from "./Dropdown.vue";
import { ref, watch, type PropType } from "vue";
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
  },
  option: {
    type: Object as PropType<{ label: string; value: string }>,
    required: true,
  },
});

const searchReq = usePagination({
  auto: false,
  cache: false,
  cb: (data: any) =>
    props.searchCb({
      ...data,
    }),
});


const value = ref(props.modelValue);
const emit = defineEmits(["update:modelValue"]);

watch(value, () => {
  emit("update:modelValue", value.value);
});

// Watch search value and trigger API call
watch(() => searchReq.search.value, () => {
  searchReq.send();
});

const input = ref()
const dropdownToggle = ref<((state?: boolean) => void) | null>(null);

function selectRow(result: any) {
  props.selectCb && props.selectCb(result);
  input.value && (input.value.value = result[props.option.label]);
  // Close the dropdown after selection
  if (dropdownToggle.value) {
    dropdownToggle.value(false);
  }
}

</script>

<template>
  <Dropdown position="right-bottom" v-slot="{ setRef, toggle }">
    <div class="relative flex items-center bg-white border border-gray-300 rounded-lg hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
      <svg class="absolute left-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        ref="input"
        @focus="() => { dropdownToggle = toggle; toggle(true); }"
        @input="(ev) => {
          searchReq.search.value = ev.target ? (ev.target as HTMLInputElement).value : ''
        }"
        class="flex-1 pl-10 pr-10 py-2.5 text-sm text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-0"
        :placeholder="placeholder"
      />
      <div class="absolute right-3 flex items-center">
        <i
          v-if="searchReq.pending.value"
          class="animate-spin text-blue-600"
          v-html="icons.spinner"
        />
        <button
          v-else-if="input?.value"
          tabindex="0"
          @click.prevent="
            () => {
              if (input) input.value = '';
              searchReq.search.value = '';
              selectCb && selectCb();
            }
          "
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    <div :ref="setRef" class="mt-2">
      <div
        tabindex="0"
        class="group w-80 h-max max-h-[20rem] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col"
      >
        <template v-if="!searchReq.data.value?.length">
          <div class="flex items-center justify-center py-8 px-4 text-sm text-gray-500">
            <div class="text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <p>
                {{
                  !searchReq.dirty.value
                    ? "Type to search..."
                    : "No results found"
                }}
              </p>
            </div>
          </div>
        </template>
        <slot name="searchResult" :result="searchReq.data.value">
          <div
            v-for="result in searchReq.data.value"
            :key="result[option.value]"
            @keydown.once.enter="selectRow(result)"
            @click.once="selectRow(result)"
            class="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="text-blue-600" v-html="icons.provider" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ result[option.label] }}
              </p>
              <p v-if="result.email || result.telephone" class="text-xs text-gray-500 truncate">
                {{ result.email || result.telephone || '' }}
              </p>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </slot>
      </div>
    </div>
  </Dropdown>
</template>
<style scoped>
.search-select-grid {
  grid-template-columns: 2rem 1fr;
  grid-template-rows: minmax(2rem, max-content) max-content;
  grid-template-areas:
    "l m"
    "e d";
}

/* Custom scrollbar styling */
.group::-webkit-scrollbar {
  width: 6px;
}

.group::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.group::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.group::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Firefox scrollbar */
.group {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f1f5f9;
}
</style>
