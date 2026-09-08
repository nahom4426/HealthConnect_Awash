<script setup>
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import CustomSelect from "@/components/CustomSelect.vue";
import { closeModal } from "@customizer/modal-x";
import { ref, computed } from "vue";
import { useApiRequest } from "@/composables/useApiRequest";
import { changeAuthorizationStatus } from "../api/authorizationApi";
import { toasted, formatMoney } from "@/utils/utils";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const api = useApiRequest();

const authorizationUuid = computed(() => props.data?.authorizationUuid);

const status = ref(props.data?.currentStatus || "REQUESTED");
const activeDays = ref(
  [undefined, null].includes(props.data?.activeDays) ? "" : String(props.data?.activeDays)
);

function toDateOnly(v) {
  if (!v) return "";
  if (typeof v === "string") {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch (_) {
    return "";
  }
}

const endDateRaw = ref(toDateOnly(props.data?.endDate));

function toDdMmYyyy(yyyyMmDd) {
  if (!yyyyMmDd) return "";
  const m = String(yyyyMmDd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

async function submit() {
  if (!authorizationUuid.value) return;
  if (!status.value) return;
  if (!endDateRaw.value) return;

  const payload = {
    status: status.value,
    endDate: toDdMmYyyy(endDateRaw.value),
    activeDays: activeDays.value ? Number(activeDays.value) : undefined,
  };

  api.send(
    () => changeAuthorizationStatus(authorizationUuid.value, payload),
    (res) => {
      if (res?.success) {
        toasted(true, "Authorization status updated", "");
        closeModal({
          success: true,
          authorizationUuid: authorizationUuid.value,
          status: payload.status,
          endDate: payload.endDate,
          activeDays: payload.activeDays,
        });
      } else {
        toasted(false, "Failed to update authorization", res?.error);
      }
    }
  );
}
</script>

<template>
  <ModalParent>
    <NewFormParent
      class="w-[30rem]"
      title="Change Authorization Status"
      subtitle="Update status and end date"
      size="sm"
    >
      <div class="flex flex-col gap-4 py-2">
        <div
          v-if="props.data?.authorizedAmount !== undefined && props.data?.authorizedAmount !== null"
          class="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl space-y-2"
        >
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-emerald-800">Authorized Amount</span>
            <span class="inline-flex gap-1.5 items-center text-sm font-bold font-mono text-emerald-950">
              <span class="text-[10px] bg-emerald-200/90 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold">ETB</span>
              {{ formatMoney(props.data?.authorizedAmount) }}
            </span>
          </div>
          <div
            v-if="props.data?.usedAmount !== undefined && props.data?.usedAmount !== null"
            class="flex justify-between items-center pt-1.5 border-t border-emerald-200/60"
          >
            <span class="text-xs font-medium text-gray-600">Used Amount</span>
            <span class="inline-flex gap-1 items-center text-xs font-semibold font-mono text-gray-800">
              <span class="text-[10px] bg-gray-200/90 text-gray-700 px-1 py-0.5 rounded font-bold">ETB</span>
              {{ formatMoney(props.data?.usedAmount) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Status</label>
            <CustomSelect
              v-model="status"
              placeholder="Select status"
              :options="[
                'REQUESTED',
                'APPROVED',
                'REJECTED',
                'CANCELLED'
              ]"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">End Date</label>
            <input
              v-model="endDateRaw"
              type="date"
              class="h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">Active Days (optional)</label>
            <input
              v-model="activeDays"
              type="number"
              min="0"
              placeholder="e.g. 10"
              class="h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div class="flex gap-3 justify-end items-center pt-2 border-t">
          <Button type="link" :disabled="api.pending.value" @click="() => !api.pending.value && closeModal(undefined)">
            Cancel
          </Button>
          <Button type="primary" :pending="api.pending.value" :disabled="api.pending.value" as="button" @click.prevent="submit">
            Save
          </Button>
        </div>
      </div>
    </NewFormParent>
  </ModalParent>
</template>
