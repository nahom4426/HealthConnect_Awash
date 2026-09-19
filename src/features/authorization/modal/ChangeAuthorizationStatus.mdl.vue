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
const amount = ref(
  [undefined, null].includes(props.data?.authorizedAmount) ? "" : String(props.data?.authorizedAmount)
);

function parseDateString(dateValue) {
  if (!dateValue) return null;
  const str = String(dateValue).trim();
  if (!str) return null;

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3],
      yyyyMmDd: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`,
      ddMmYyyy: `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`,
    };
  }

  const ddmmyyyyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmmyyyyMatch) {
    return {
      year: ddmmyyyyMatch[3],
      month: ddmmyyyyMatch[2],
      day: ddmmyyyyMatch[1],
      yyyyMmDd: `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`,
      ddMmYyyy: `${ddmmyyyyMatch[1]}/${ddmmyyyyMatch[2]}/${ddmmyyyyMatch[3]}`,
    };
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return {
        year: yyyy,
        month: mm,
        day: dd,
        yyyyMmDd: `${yyyy}-${mm}-${dd}`,
        ddMmYyyy: `${dd}/${mm}/${yyyy}`,
      };
    }
  } catch (_) {}

  return null;
}

function toDateOnly(v) {
  const parsed = parseDateString(v);
  return parsed ? parsed.yyyyMmDd : "";
}

const endDateRaw = ref(toDateOnly(props.data?.endDate));

function toDdMmYyyy(v) {
  const parsed = parseDateString(v);
  return parsed ? parsed.ddMmYyyy : "";
}

async function submit() {
  if (!authorizationUuid.value) return;
  if (!status.value) return;

  if (!endDateRaw.value) {
    toasted(false, "Please select an end date", "");
    return;
  }

  const parsedAmount = amount.value !== "" && amount.value !== null && amount.value !== undefined ? Number(amount.value) : (props.data?.authorizedAmount ?? 0);

  const parsedAmount = amount.value !== "" && amount.value !== null && amount.value !== undefined ? Number(amount.value) : (props.data?.authorizedAmount ?? 0);

  const payload = {
    status: status.value,
    endDate: toDdMmYyyy(endDateRaw.value),
    activeDays: activeDays.value ? Number(activeDays.value) : undefined,
    amount: parsedAmount,
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
          endDate: endDateRaw.value ? `${endDateRaw.value}T00:00:00.000+00:00` : payload.endDate,
          activeDays: payload.activeDays,
          authorizedAmount: payload.amount,
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
            <label class="text-sm font-medium text-gray-700">Authorized Amount</label>
            <input
              v-model="amount"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 1000.00"
              class="h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
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
