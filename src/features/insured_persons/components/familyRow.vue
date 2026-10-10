<script setup>
import { defineProps, onMounted, onUnmounted } from 'vue';
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";

const props = defineProps({
  rowData: { type: Array, required: true },
  rowKeys: { type: Array, required: true },
  onRemove: { type: Function, default: () => {} },
  onRefetch: { type: Function, default: () => {} },
  onRowClick: { type: Function, default: () => {} },
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 25 }
});

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0
  }).format(amount);
}

function getPackageCount(packagesObj, packageUuids) {
  if (Array.isArray(packageUuids) && packageUuids.length) {
    return packageUuids.length;
  }
  if (packagesObj && typeof packagesObj === 'object') {
    return Object.keys(packagesObj).length;
  }
  return 0;
}

function toggleDropdown(event, rowId) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${rowId}`);
  if (dropdown) dropdown.classList.toggle('hidden');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(el => {
    el.classList.add('hidden');
  });
}

function handleEditWithClose(row) {
  closeAllDropdowns();
  openModal('EditGroup', row, (result) => {
    if (result?.success) props.onRefetch();
  });
}

function handleViewWithClose(row) {
  closeAllDropdowns();
  openModal('AddMembersToGroup', row, (result) => {
    if (result?.success) props.onRefetch();
  });
}

function handleRemoveWithClose(rowId) {
  closeAllDropdowns();
  props.onRemove(rowId);
}

onMounted(() => {
  window.addEventListener('click', closeAllDropdowns);
});
onUnmounted(() => {
  window.removeEventListener('click', closeAllDropdowns);
});
</script><template>
  <tr 
    v-for="(row, idx) in rowData" 
    :key="row.serviceQuotedUuid || idx"
    @click.self="props.onRowClick(row)"
    class="bg-white border-b border-line transition-all duration-200 cursor-pointer hover:bg-primary/[0.015] group"
  >
    <!-- Index Number -->
    <td class="p-4">
      <div class="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
        <span class="text-sm font-bold text-primary-hover select-none">
          {{ (props.currentPage - 1) * props.perPage + idx + 1 }}
        </span>
      </div>
    </td>

    <!-- Data cells -->
    <td 
      v-for="key in rowKeys" 
      :key="key" 
      class="p-4"
    >
      <!-- Plan Type -->
      <template v-if="key === 'planType'">
        <div class="inline-flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-primary/5 to-primary/5 rounded-lg border border-primary/10">
          <div class="w-2 h-2 bg-primary rounded-full"></div>
          <span class="text-sm font-semibold text-primary-hover">
            {{ row.planType }}
          </span>
        </div>
      </template>

      <!-- Package Name -->
      <template v-else-if="key === 'packageName'">
        <div class="inline-flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-success-soft to-teal-50 rounded-lg border border-success-soft">
          <div class="w-2 h-2 bg-success rounded-full"></div>
          <span class="text-sm font-semibold text-ink">{{ row.packageName }}</span>
          <span class="px-2 py-0.5 text-xs font-medium text-success-strong bg-success-soft rounded">
            Benefit
          </span>
        </div>
      </template>

      <!-- Coverage & Premium (Currency) -->
      <template v-else-if="key === 'coverage' || key === 'premium'">
        <div class="px-3 py-2 bg-gradient-to-r from-success-soft to-success-soft rounded-lg border border-success-soft">
          <span class="text-sm font-bold text-success-strong">
            {{ formatCurrency(row[key]) }}
          </span>
        </div>
      </template>

      <!-- Rate -->
      <template v-else-if="key === 'rate'">
        <div class="inline-flex gap-2 items-center px-3 py-2 bg-gradient-to-r from-warning-soft to-orange-50 rounded-lg border border-warning-soft">
          <span class="text-sm font-semibold text-warning-strong">
            {{ Number(row.rate) || 0 }}
          </span>
          <span class="text-xs font-medium text-warning">rate</span>
        </div>
      </template>

      <!-- Number of Insured -->
      <template v-else-if="key === 'numberOfInsured'">
        <div class="relative">
          <div class="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-primary/5 to-purple-50 rounded-full border border-primary/10">
            <span class="text-base font-bold text-primary-hover">
              {{ Number(row.numberOfInsured) || 0 }}
            </span>
          </div>
          <!-- <div class="absolute -right-1 -bottom-1 px-2 py-0.5 bg-primary/10 rounded-md">
            <span class="text-xs font-medium text-primary-hover">Insured</span>
          </div> -->
        </div>
      </template>

      <!-- Number of Dependants -->
      <template v-else-if="key === 'numberOfDependants'">
        <div class="relative">
          <div class="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-full border border-fuchsia-100">
            <span class="text-base font-bold text-fuchsia-700">
              {{ Number(row.numberOfDependants) || 0 }}
            </span>
          </div>
        </div>
      </template>

      <!-- Default cell content -->
      <template v-else>
        <div class="px-3 py-2 bg-surface-muted rounded-lg border border-line">
          <span class="text-sm text-ink-muted">{{ row[key] }}</span>
        </div>
      </template>
    </td>

    <!-- Actions Dropdown -->
    <td class="p-4">
      <div class="relative">
        <!-- Action button -->
        <button 
          @click.stop="toggleDropdown($event, row.serviceQuotedUuid)"
          aria-label="Actions"
          class="p-2 rounded-lg transition-all hover:bg-primary/10 hover:scale-105"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-ink-muted transition-colors hover:text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div 
          :id="`dropdown-${row.serviceQuotedUuid}`"
          class="hidden absolute right-0 z-50 mt-2 w-56 bg-white rounded-xl border border-line shadow-xl dropdown-menu"
        >
          <!-- Dropdown header -->
          <div class="px-4 py-3 border-b border-line">
            <div class="flex gap-3 items-center">
              <div class="flex justify-center items-center w-8 h-8 bg-gradient-to-br from-primary to-primary rounded-lg">
                <span class="text-xs font-bold text-white">P</span>
              </div>
              <div>
                <p class="text-sm font-semibold text-ink">{{ row.planType || 'Plan' }}</p>
                <p class="text-xs text-ink-subtle">Action Menu</p>
              </div>
            </div>
          </div>

          <!-- Dropdown items -->
          <div class="py-2">
            <!-- Edit Button -->
            <button 
              @click.stop="handleEditWithClose(row)" 
              class="flex gap-3 items-center px-4 py-3 w-full text-ink-muted transition-colors hover:bg-primary/5 group/item"
            >
              <div class="p-1.5 bg-primary/10 rounded-md group-hover/item:bg-primary/20">
                <i v-html="icons.edits || '✏️'" class="w-4 h-4 text-primary" />
              </div>
              <div class="text-left">
                <span class="text-sm font-medium">Edit</span>
                <p class="text-xs text-ink-subtle">Modify plan details</p>
              </div>
              <svg class="ml-auto w-4 h-4 text-ink-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- Add Insured Person -->
            <button 
              @click.stop="handleViewWithClose(row)" 
              class="flex gap-3 items-center px-4 py-3 w-full text-ink-muted transition-colors hover:bg-success-soft group/item"
            >
              <div class="p-1.5 bg-success-soft rounded-md group-hover/item:bg-success/20">
                <i v-html="icons.details || '➕'" class="w-4 h-4 text-success" />
              </div>
              <div class="text-left">
                <span class="text-sm font-medium">Add Insured</span>
                <p class="text-xs text-ink-subtle">Add new insured person</p>
              </div>
              <svg class="ml-auto w-4 h-4 text-ink-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <!-- Divider -->
            <div class="my-2 h-px bg-line"></div>

            <!-- Deactivate Button -->
            <button 
              @click.stop="handleRemoveWithClose(row.serviceQuotedUuid)" 
              class="flex gap-3 items-center px-4 py-3 w-full text-error transition-colors hover:bg-error-soft group/item"
            >
              <div class="p-1.5 bg-error-soft rounded-md group-hover/item:bg-error/20">
                <i v-html="icons.deactivate || '🚫'" class="w-4 h-4 text-error" />
              </div>
              <div class="text-left">
                <span class="text-sm font-semibold">Deactivate</span>
                <p class="text-xs text-error">Disable this plan</p>
              </div>
              <svg class="ml-auto w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Dropdown footer -->
          <div class="px-4 py-2 bg-surface-muted rounded-b-xl border-t border-line">
            <p class="text-xs text-ink-subtle">ID: {{ row.serviceQuotedUuid?.slice(-8) || 'N/A' }}</p>
          </div>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
.dropdown-menu {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top right;
  opacity: 0;
  transform: scale(0.95) translateY(-5px);
  pointer-events: none;
}

.dropdown-menu:not(.hidden) {
  opacity: 1;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

/* Subtle scale on button hover */
button {
  transition: all 0.2s ease;
}

/* Row hover effect */
tr {
  transition: all 0.2s ease;
}

tr:hover {
  box-shadow: 0 2px 8px rgb(var(--primary) / 0.1);
}

/* Smooth icon transitions */
i {
  transition: transform 0.2s ease;
}

.group:hover i {
  transform: scale(1.05);
}
</style>