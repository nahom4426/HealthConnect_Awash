<script setup>
// Year-end adjustment (plan 7.5): the backend's statement, then Post adjustment. data: { cover }.
// Closes with the adjusted cover.
import { onMounted, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import AdjustmentStatement from "../components/AdjustmentStatement.vue";
import PageState from "../components/PageState.vue";
import { runAdjustment } from "../api/marineApi";
import { notifyError } from "../api/marineClient";

const props = defineProps({ data: { type: Object, required: true } });
const c = props.data.cover;
const statement = ref(null);
const error = ref(null);
const pending = ref(false);

onMounted(async () => {
  const res = await runAdjustment(c.id, { dryRun: true });
  if (res.ok) statement.value = res.data;
  else error.value = res.error;
});

async function post() {
  pending.value = true;
  const res = await runAdjustment(c.id, {});
  pending.value = false;
  if (res.ok) {
    toasted(true, `Adjustment for ${c.coverNo} posted`);
    closeModal(res.data);
  } else if (res.error.status === 409) error.value = res.error;
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="`Year-end adjustment for ${c.coverNo}`">
      <p v-if="error" role="alert" class="p-3 text-sm rounded-xl bg-error-soft text-error-strong">{{ error.message }}</p>
      <PageState v-else-if="!statement" kind="loading" />
      <template v-else>
        <AdjustmentStatement :statement="statement" />
        <p class="text-xs text-ink-muted">Posting sends this to the accounting export. It can only be done once.</p>
      </template>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button :disabled="!statement || !!error" :pending="pending" @click="post">Post adjustment</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
