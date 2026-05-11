<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { getClaimLevels, deleteClaimLevel } from "../api/claimLevelApi";
import ClaimLevelTableRow from "../components/ClaimLevelTableRow.vue";
import { openModal } from "@customizer/modal-x";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import Button from "@/components/Button.vue";
import icons from "@/utils/icons";
import { useClaimLevel } from "../store/claimLevelStore";

const claimLevelStore = useClaimLevel();
const loading = ref(false);
const editData = ref(null);
const deleteTarget = ref(null);
const searchQuery = ref("");

const claimLevels = computed(() => claimLevelStore.claimLevels);

async function fetchClaimLevels() {
  loading.value = true;
  try {
    const response = await getClaimLevels();
    claimLevelStore.set(response.data || []);
  } catch (error) {
    console.error("Error fetching claim levels:", error);
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editData.value = null;
  openModal("CreateClaimLevel");
}

function handleEdit(row) {
  editData.value = row;
  openModal("EditClaimLevel");
}

function handleDeleteClick(row) {
  deleteTarget.value = row;
  openModal("ConfirmModal");
}

async function confirmDelete() {
  if (!deleteTarget.value || !deleteTarget.value.claimLevelUuid) return;

  try {
    await deleteClaimLevel(deleteTarget.value.claimLevelUuid);
    await fetchClaimLevels();
    deleteTarget.value = null;
  } catch (error) {
    console.error("Error deleting claim level:", error);
  }
}

function handleSuccess() {
  fetchClaimLevels();
}

const filteredLevels = ref([]);

function filterLevels() {
  if (!searchQuery.value) {
    filteredLevels.value = claimLevels.value;
    return;
  }

  const query = searchQuery.value.toLowerCase();
  filteredLevels.value = claimLevels.value.filter((level) => {
    return (
      level.claimLevel.toLowerCase().includes(query) ||
      level.min.toString().includes(query) ||
      level.max.toString().includes(query)
    );
  });
}

onMounted(() => {
  fetchClaimLevels();
});

watch([claimLevels, searchQuery], filterLevels, { immediate: true });
</script>

<template>
  <DefaultPage placeholder="Search claim levels...">
    <template #add-action>
      <button
        @click="handleAdd"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Level</p>
      </button>
    </template>

    <template #default="{ search }">
      <div v-if="search" style="display: none">{{ searchQuery = search }}</div>

      <Table
        :pending="loading"
        :show-pagination=false
        :headers="{
          head: [
          
            'Claim Level',
            'Minimum Amount',
            'Maximum Amount',
            'Range',
            'Actions',
          ],
          row: [
            '',
            'claimLevel',
            'minAmount',
            'maxAmount',
            '',
          ],
        }"
        :rows="filteredLevels"
        :rowCom="ClaimLevelTableRow"
        placeholder="No claim levels found"
      >
        <template #row>
          <ClaimLevelTableRow
            :rowData="filteredLevels"
            :rowKeys="['', 'claimLevel', 'minAmount', 'maxAmount', '']"
            :headKeys="['#', 'Claim Level', 'Minimum Amount', 'Maximum Amount', 'Range', 'Actions']"
            @edit="handleEdit"
            @delete="handleDeleteClick"
          />
        </template>
      </Table>
    </template>
  </DefaultPage>
</template>
