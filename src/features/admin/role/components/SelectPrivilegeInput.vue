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
    <div :ref="setRef" class="flex flex-col gap-2">
      <div class="flex items-center gap-2 border-b py-2">
        <span 
          :data-required="`${validation}`.includes('required') ? 'true' : 'false'" 
          :title="label" 
          class="text-sm capitalize px-1 truncate" 
          v-if="label"
        >
          {{ label }}
        </span>
        <InputError :error="error" />
      </div>
      
      <div class="grid grid-cols-4 gap-y-4">
        <div v-for="category in Object.keys(group)" :key="category">
          <div class="border-b py-2 flex items-center gap-2">
            <input 
              :checked="isAllChecked(category)" 
              @click="(ev) => selectAll(ev.target.checked, category)"
              class="size-5" 
              type="checkbox" 
            />
            <p class="font-bold">{{ category }}</p>
          </div>
          
          <div 
            class="flex items-center py-2 gap-2" 
            v-for="privilege in group[category]" 
            :key="privilege.privilegeUuid"
          >
            <input 
              :checked="isChecked(privilege.privilegeUuid)" 
              @click="toggle(privilege.privilegeUuid)" 
              class="size-4"
              type="checkbox" 
            />
            <p class="text-xs truncate">{{ privilege.privilegeName }}</p>
          </div>
        </div>
      </div>
      
      <input type="hidden" :name="name" :value="JSON.stringify(selected)" />
    </div>
  </InputParent>
</template>
