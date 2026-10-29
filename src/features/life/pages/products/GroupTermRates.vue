<script setup>
import { ref, watch } from "vue";
import TabGroup from "@/components/TabGroup.vue";
import PageHeader from "@/components/PageHeader.vue";
import RateTableEditor from "../../components/RateTableEditor.vue";
import { useRateTable } from "../../composables/useRateTable";
import { groupTermSpec } from "../../rates/rateTables";
import { RecordStatus } from "../../constants/statuses";
import { deleteGroupTerm, getGroupTerms, importTerm, updateGroupTerms } from "../../api/productApi";

const TABS = { Active: RecordStatus.ACTIVE, Pending: RecordStatus.PENDING, Disabled: RecordStatus.DISABLED };
const tab = ref("Active");

const table = useRateTable({
  list: (status) => getGroupTerms({ status }),
  bulkSave: updateGroupTerms,
  remove: deleteGroupTerm,
  importFile: importTerm,
  idField: groupTermSpec.idField,
  label: "Group term rates",
});

watch(tab, (t) => table.reload(TABS[t]), { immediate: true });
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader
      title="Group term rates"
      subtitle="Annual premium rate by age and gender for group term life. Group quotations are priced from the active table."
    />
    <TabGroup v-model="tab" :tabs="Object.keys(TABS)" class="mb-4" />
    <RateTableEditor
      :spec="groupTermSpec"
      :rows="table.rows.value"
      :loading="table.loading.value"
      :load-error="table.error.value"
      :saving="table.saving.value"
      :importing="table.importing.value"
      :default-status="TABS[tab]"
      importable
      @retry="table.reload()"
      @save="table.save"
      @remove="table.remove"
      @import="table.importFile"
    />
  </div>
</template>
