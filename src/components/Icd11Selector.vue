<script setup>
import { ref, onMounted } from "vue";
import { getIcd11Blocks, getIcd11Children } from "../api/icd11Api";
import { useApiRequest } from "@/composables/useApiRequest";
import icons from "@/utils/icons";

const props = defineProps({
  label: {
    type: String,
    default: "Diagnosis",
  },
  modelValue: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const levels = ref([]); // Array of { options: [], selected: null, loading: false }
const fetchReq = useApiRequest();

async function fetchInitialBlocks() {
  const level = { options: [], selected: null, loading: true };
  levels.value.push(level);
  const index = levels.value.length - 1;

  fetchReq.send(
    () => getIcd11Blocks(),
    (res) => {
      levels.value[index].loading = false;
      if (res && res.success) {
        levels.value[index].options = res.data  [];
      }
    }
  );
}

async function handleSelection(levelIndex) {
  const currentLevel = levels.value[levelIndex];
  const selectedOption = currentLevel.options.find((opt) => opt.code === currentLevel.selected);

  // Remove all levels after this one
  levels.value.splice(levelIndex + 1);

  if (selectedOption) {
    if (selectedOption.hasChildren && levels.value.length < 5) {
      const nextLevel = { options: [], selected: null, loading: true };
      levels.value.push(nextLevel);
      const nextIndex = levels.value.length - 1;

      fetchReq.send(
        () => getIcd11Children(selectedOption.code),
        (res) => {
          levels.value[nextIndex].loading = false;
          if (res && res.success) {
            levels.value[nextIndex].options = res.data  [];
          }
        }
      );
      emit("update:modelValue", "");
    } else {
      emit("update:modelValue", selectedOption.title);
    }
  } else {
    emit("update:modelValue", "");
  }
}

onMounted(() => {
  fetchInitialBlocks();
});
</script>

<template>
  <div class="flex flex-col gap-2 w-full group">
    <label
      class="text-xs font-bold tracking-wider text-gray-400 uppercase transition-colors group-focus-within:text-primary"
    >
      {{ label }}
    </label>

    <div class="flex flex-col gap-3">
      <TransitionGroup name="list">
        <div v-for="(level, index) in levels" :key="index" class="relative">
          <select
            v-model="level.selected"
            class="p-4 w-full font-medium text-gray-700 bg-white rounded-xl border-2 transition-all appearance-none outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
            :class="[
              error && index === 0 ? 'border-red-200 bg-red-50' : 'border-gray-100',
              level.loading ? 'opacity-50' : '',
            ]"
            :disabled="level.loading"
            @change="handleSelection(index)"
          >
            <option :value="null" disabled>
              {{
                level.loading ? "Loading..." : Select ${index === 0 ? "Block" : "Sub-category"}
              }}
            </option>
            <option v-for="option in level.options" :key="option.code" :value="option.code">
              {{ option.code }} - {{ option.title }}
            </option>
          </select>
          <div
            class="absolute right-4 top-1/2 w-5 h-5 text-gray-400 -translate-y-1/2 pointer-events-none"
            v-html="icons.down"
          ></div>
        </div>
      </TransitionGroup>
    </div>

    <div
      v-if="modelValue"
      class="flex gap-2 items-center p-3 mt-1 rounded-lg border bg-primary/5 border-primary/10"
    >
      <div class="w-2 h-2 rounded-full bg-primary"></div>
      <p class="text-sm font-bold text-primary">
        {{ modelValue }}
      </p>
    </div>

    <Transition name="fade">
      <p v-if="error" class="flex gap-1 items-center mt-1 text-xs font-bold text-red-500">
        <span class="w-1 h-1 bg-red-500 rounded-full"></span>
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
select {
  background-image: none;
}.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>