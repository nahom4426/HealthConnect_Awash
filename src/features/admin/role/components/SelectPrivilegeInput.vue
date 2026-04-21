<script setup>
import InputError from '@/components/new_form_elements/InputError.vue';
import InputParent from '@/components/new_form_builder/InputParent.vue';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  label: String,
  value: String,
  options: {
    type: Array,
    required: true,
  },
  selectedPrivilege: {
    type: Array,
  },
  validation: String,
  name: String,
});

const selected = ref([]);

// Group privileges by category
const group = computed(() => {
  return props?.options.reduce((state, el) => {
    if (state[el.privilegeCategory]) {
      state[el.privilegeCategory].push(el);
    } else {
      state[el.privilegeCategory] = [el];
    }
    return state;
  }, {});
});

// Watch for changes in selectedPrivilege prop
watch(
  () => props.selectedPrivilege,
  (newPrivileges) => {
    
    if (!Array.isArray(newPrivileges)) {
      selected.value = [];
      return;
    }
    
    // Reset selected array
    selected.value = [];
    
    // Add each privilege UUID to the selected array
    newPrivileges.forEach((el) => {
      if (typeof el === 'string') {
        // If el is already a UUID string
        selected.value.push(el);
      } else if (el && el.privilegeUuid) {
        // If el is an object with privilegeUuid property
        selected.value.push(el.privilegeUuid);
      }
    });
    
  },
  { immediate: true }
);
function toggle(id) {
  if (!selected.value.includes(id)) {
    selected.value.push(id);
  } else {
    const idx = selected.value.findIndex((el) => el == id);
    idx > -1 && selected.value.splice(idx, 1);
  }
}

const isChecked = computed(() => {
  return (id) => selected.value.includes(id);
});

const isAllChecked = computed(() => {
  return (category) =>
    group.value[category] && group.value[category].every((el) =>
      selected.value.includes(el.privilegeUuid)
    );
});

function selectAll(checked, category) {
  if (!group.value[category]) return;
  
  const ids = group.value[category].map((el) => el.privilegeUuid);
  selected.value = selected.value.filter((el) => !ids.includes(el));
  if (checked) {
    selected.value = [...selected.value, ...ids];
  }
}
</script>
<template>
  <InputParent :validation="validation" :name="name" v-model="selected" v-slot="{ setRef, error }">
    <div :ref="setRef" class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex gap-2 justify-between items-center pb-3 border-b-2 border-gray-200">
        <div class="flex gap-2 items-center">
          <span 
            :data-required="`${validation}`.includes('required') ? 'true' : 'false'" 
            :title="label" 
            class="text-sm font-semibold text-gray-900 capitalize truncate sm:text-base" 
            v-if="label"
          >
            {{ label }}
          </span>
          <span class="px-2 py-1 text-xs font-bold text-indigo-600 bg-indigo-100 rounded-full">
            {{ selected.length }} selected
          </span>
        </div>
        <InputError :error="error" />
      </div>
      
      <!-- Categories Grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="category in Object.keys(group)" 
          :key="category"
          class="overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200 transition-all duration-200 hover:border-indigo-300"
        >
          <!-- Category Header -->
          <div class="flex gap-3 items-center p-3 bg-gradient-to-r from-indigo-500 to-purple-600 sm:p-4">
            <input 
              :checked="isAllChecked(category)" 
              @click="(ev) => selectAll(ev.target.checked, category)"
              class="w-5 h-5 rounded cursor-pointer accent-white" 
              type="checkbox" 
              :title="`Select all ${category} privileges`"
            />
            <p class="flex-1 text-sm font-bold text-white truncate sm:text-base">{{ category }}</p>
            <span class="px-2 py-1 text-xs font-semibold text-white rounded-full bg-white/20">
              {{ group[category].filter(p => isChecked(p.privilegeUuid)).length }}/{{ group[category].length }}
            </span>
          </div>
          
          <!-- Privileges List -->
          <div class="p-3 space-y-2 sm:p-4">
            <div 
              v-for="privilege in group[category]" 
              :key="privilege.privilegeUuid"
              class="flex gap-3 items-start p-2 rounded-lg transition-all duration-150 cursor-pointer hover:bg-white group/item"
              @click="toggle(privilege.privilegeUuid)"
            >
              <input 
                :checked="isChecked(privilege.privilegeUuid)" 
                @click.stop="toggle(privilege.privilegeUuid)" 
                class="flex-shrink-0 mt-0.5 w-4 h-4 rounded cursor-pointer accent-indigo-600"
                type="checkbox" 
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-gray-900 truncate transition-colors sm:text-sm group-hover/item:text-indigo-600">
                  {{ privilege.privilegeName }}
                </p>
                <p class="mt-0.5 text-xs text-gray-600 line-clamp-2">
                  {{ privilege.privilegeDescription }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div v-if="selected.length > 0" class="p-3 bg-indigo-50 rounded border-l-4 border-indigo-500 sm:p-4">
        <p class="text-xs font-semibold text-indigo-900 sm:text-sm">
          ✓ {{ selected.length }} privilege{{ selected.length !== 1 ? 's' : '' }} selected
        </p>
      </div>
      
      <input type="hidden" :name="name" :value="JSON.stringify(selected)" />
    </div>
  </InputParent>
</template>

<style scoped>
/* Custom checkbox styling */
:deep(input[type="checkbox"]) {
  @apply cursor-pointer;
}

:deep(input[type="checkbox"]:hover) {
  @apply scale-110 transition-transform;
}
</style>
