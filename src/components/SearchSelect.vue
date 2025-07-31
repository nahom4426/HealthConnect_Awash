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

const input = ref()
function selectRow(result: any) {
  props.selectCb && props.selectCb(result);
  input.value && (input.value.value = result[props.option.label])
}

</script>

<template>
  <Dropdown position="right-bottom" v-slot="{ setRef, toggle }">
    <div class="focus-within:sys-focus !pr-0 input-style flex">
      <input
        ref="input"
        @focus="toggle(true)"
        @input="(ev) => {
          searchReq.search.value = ev.target ? (ev.target as HTMLInputElement).value : ''
        }"
        class="flex-1 focus:shadow-none"
        :placeholder="placeholder"
      />
      <div class="size-10 grid place-items-center">
        <i
          v-if="searchReq.pending.value"
          class="animate-spin"
          v-html="icons.spinner"
        />
        <button
          v-else
          tabindex="0"
          :key="input?.value"
          @click.once.prevent="
            () => {
              input.value = '';
              selectCb && selectCb();
            }
          "
        >
          <i v-html="icons.close" />
        </button>
      </div>
    </div>
    <div :ref="setRef">
      <div
        tabindex="0"
        class="group w-80 h-max max-h-[20rem] show-scrollbar border flex flex-col gap-2 rounded bg-base-clr4 shadow-lg !p-2"
      >
        <template v-if="!searchReq.data.value?.length">
          <div class="m-auto text-sm">
            {{
              !searchReq.dirty.value
                ? "Type to Search..."
                : "Search with Another Keyword"
            }}
          </div>
        </template>
        <slot name="searchResult" :result="searchReq.data.value">
          <div
            v-for="result in searchReq.data.value"
            :key="result[option.value]"
            class="grid search-select-grid w-full items-center gap-x-2"
          >
            <div class="grid place-items-center size-8">
              <i class="*:size-4" v-html="icons.provider" />
            </div>
            <b
              v-ripple
              :key="input?.value"
              tabindex="0"
							@keydown.once.enter="selectRow(result)"
              @click.once="selectRow(result)"
              class="cursor-pointer"
              >{{ result[option.label] }}</b
            >
          </div>
        </slot>
      </div>
    </div>
  </Dropdown>
</template>
<style>
.search-select-grid {
  grid-template-columns: 2rem 1fr;
  grid-template-rows: minmax(2rem, max-content) max-content;
  grid-template-areas:
    "l m"
    "e d";
}
</style>
