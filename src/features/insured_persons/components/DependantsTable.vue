<template>
  <div class="overflow-x-auto">
    <table class="min-w-full bg-white border border-gray-200">
      <thead>
        <tr>
          <th class="py-2 px-4 border-b text-left">Name</th>
          <th class="py-2 px-4 border-b text-left">Relationship</th>
          <th class="py-2 px-4 border-b text-left">Age</th>
          <th class="py-2 px-4 border-b text-left">Gender</th>
          <th class="py-2 px-4 border-b text-left">Status</th>
          <th class="py-2 px-4 border-b text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(dependant, index) in dependants" :key="index" class="hover:bg-gray-50">
          <td v-if="editingIndex === index" class="py-2 px-4 border-b">
            <input v-model="editingDependant.fullName" class="border p-1 w-full" />
          </td>
          <td v-else class="py-2 px-4 border-b">{{ dependant.fullName }}</td>
          
          <td v-if="editingIndex === index" class="py-2 px-4 border-b">
            <select v-model="editingDependant.relationship" class="border p-1 w-full">
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
            </select>
          </td>
          <td v-else class="py-2 px-4 border-b">{{ dependant.relationship }}</td>
          
          <td v-if="editingIndex === index" class="py-2 px-4 border-b">
            <input v-model.number="editingDependant.age" type="number" class="border p-1 w-full" />
          </td>
          <td v-else class="py-2 px-4 border-b">{{ dependant.age }}</td>
          
          <td v-if="editingIndex === index" class="py-2 px-4 border-b">
            <select v-model="editingDependant.gender" class="border p-1 w-full">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </td>
          <td v-else class="py-2 px-4 border-b">{{ dependant.gender }}</td>
          
          <td v-if="editingIndex === index" class="py-2 px-4 border-b">
            <select v-model="editingDependant.status" class="border p-1 w-full">
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </td>
          <td v-else class="py-2 px-4 border-b">
            <span 
              :class="dependant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              class="px-2 py-1 rounded-full text-xs font-medium"
            >
              {{ dependant.status === 'ACTIVE' ? 'Active' : 'Inactive' }}
            </span>
          </td>
          
          <td class="py-2 px-4 border-b">
            <div class="dropdown-container relative">
              <button 
                @click.stop="toggleDropdown($event, dependant.dependantUuid || index)"
                class="inline-flex items-center justify-center p-2 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 focus:outline-none"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              <div 
                :id="`dropdown-${dependant.dependantUuid || index}`"
                class="dropdown-menu hidden absolute right-0 z-10 w-44 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="py-1">
                  <template v-if="editingIndex === index">
                    <button 
                      @click.stop="saveEdit()"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <i class="fas fa-save mr-2"></i>
                      Save
                    </button>
                    <button 
                      @click.stop="cancelEdit()"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <i class="fas fa-times mr-2"></i>
                      Cancel
                    </button>
                  </template>
                  <template v-else>
                    <button 
                      @click.stop="startEdit(index, dependant)"
                      class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <i class="fas fa-edit mr-2"></i>
                      Edit
                    </button>
                    <button 
                      v-if="dependant.status === 'ACTIVE'"
                      @click.stop="toggleStatus(dependant, 'INACTIVE')"
                      class="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <i class="fas fa-ban mr-2"></i>
                      Deactivate
                    </button>
                    <button 
                      v-else
                      @click.stop="toggleStatus(dependant, 'ACTIVE')"
                      class="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                    >
                      <i class="fas fa-check-circle mr-2"></i>
                      Activate
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useToast } from '@/toast/store/toast';

const props = defineProps({
  dependants: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update-dependant', 'toggle-status']);

const { toasted } = useToast();
const editingIndex = ref(-1);
const editingDependant = ref({});

function toggleDropdown(event, id) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${id}`);
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

function startEdit(index, dependant) {
  closeAllDropdowns();
  editingIndex.value = index;
  // Create a deep copy to avoid modifying the original
  editingDependant.value = JSON.parse(JSON.stringify(dependant));
}

function saveEdit() {
  if (!editingDependant.value.fullName) {
    toasted(false, '', 'Name is required');
    return;
  }
  
  emit('update-dependant', editingDependant.value);
  editingIndex.value = -1;
}

function cancelEdit() {
  editingIndex.value = -1;
}

function toggleStatus(dependant, newStatus) {
  closeAllDropdowns();
  emit('toggle-status', dependant, newStatus);
}

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});

onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});
</script>

<style scoped>
.dropdown-menu {
  min-width: 150px;
  transition: all 0.2s ease-out;
  transform-origin: top right;
}

.dropdown-menu.hidden {
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
}
</style>