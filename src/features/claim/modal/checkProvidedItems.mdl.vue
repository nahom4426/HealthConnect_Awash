<script setup>
import { ref, computed, watch } from "vue";
import Button from "@/components/Button.vue";
import icons from "@/utils/icons";
import { formatCurrency } from "@/utils/utils";
import { useApiRequest } from "@/composables/useApiRequest";
import { updateServiceProvidedClaimStatus } from "../api/claimApi";
import { useClaimByInstitutionBatch } from "../store/claimByInstitutionBatchStore";

const props = defineProps({
  row: { type: Object, default: null },         // full row (serviceProvidedUuid + claimUuid)
  items: { type: Array, default: () => [] },
  title: { type: String, default: "Provided Items" },
});

const emit = defineEmits(["close"]);

const localRow = ref(props.row);
const localItems = ref([...props.items]);

watch(() => props.row, (v) => (localRow.value = v), { immediate: true });
watch(() => props.items, (v) => (localItems.value = v ? [...v] : []), { immediate: true });

const total = computed(() =>
  localItems.value.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0)
);

const remark = ref("");
const req = useApiRequest();
const store = useClaimByInstitutionBatch();

function detectType(it) {
  if (!it) return "Service";
  if (it.type) return it.type;
  const id = (it.itemId || "").toString().toUpperCase();
  if (/^(DR|RX|MED|D)/.test(id)) return "Drug";
  if (/^X-?R/.test(id)) return "Service";
  return "Service";
}

async function performAction(action) {
  if (!localRow.value) return;
  const claimId = localRow.value.claimUuid || localRow.value?.claimUuid;
  const body = [localRow.value.serviceProvidedUuid];
  const remarkVal = remark.value && remark.value.trim() ? remark.value.trim() : undefined;

  req.send(
    () => updateServiceProvidedClaimStatus(claimId, action, body, remarkVal),
    (res) => {
      if (res && res.status >= 200 && res.status < 300) {
        // update status in store instead of removing or relying on parent
        const updated = (store.claims || []).map((claim) => {
          if (body.includes(claim.serviceProvidedUuid)) {
            return { ...claim, serviceClaimStatus: action };
          }
          return claim;
        });
        if (store.set) {
          store.set(updated);
        } else {
          // fallback when set is not available
          store.claims = updated;
        }
        emit("close");
      }
    }
  );
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
    <div class="w-full max-w-3xl bg-white rounded-lg shadow-xl overflow-hidden">
      <div class="flex items-start justify-between gap-4 px-6 py-4 border-b">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
            <span v-html="icons.box" class="w-6 h-6"></span>
          </div>
          <div>
            <h3 class="text-lg font-semibold">{{ title }}</h3>
            <p class="text-sm text-gray-500">
              {{ localItems.length }} item{{ localItems.length !== 1 ? "s" : "" }} •
              total: <span class="font-medium">{{ formatCurrency(total) }}</span>
            </p>
            <p class="text-xs text-gray-500 mt-1">ServiceProvided UUID: {{ localRow?.serviceProvidedUuid }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button size="sm" type="link" @click="$emit('close')">Close</Button>
        </div>
      </div>

      <div class="p-4">
        <div class="overflow-auto"> 
          <table class="min-w-full bg-white text-sm">
            <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th class="px-4 py-3 text-left">#</th>
                <th class="px-4 py-3 text-left">Item ID</th>
                <th class="px-4 py-3 text-left">Code</th>
                <th class="px-4 py-3 text-left">Name</th>
                <th class="px-4 py-3 text-left">Type</th>
                <th class="px-4 py-3 text-right">Qty</th>
                <th class="px-4 py-3 text-right">Unit Price</th>
                <th class="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!localItems.length">
                <td :colspan="8" class="py-8 text-center text-gray-500">
                  <div v-html="icons.no_data" class="mx-auto mb-3 w-16 h-16"></div>
                  No items available
                </td>
              </tr>
              <tr v-for="(it, i) in localItems" :key="it.providedItemUuid || i" class="hover:bg-gray-50">
                <td class="px-4 py-3 text-gray-600">{{ i + 1 }}</td>
                <td class="px-4 py-3 text-gray-700">{{ it.itemId || '-' }}</td>
                <td class="px-4 py-3 text-gray-700">{{ it.itemCode || '-' }}</td>
                <td class="px-4 py-3 text-gray-700">{{ it.itemName || '-' }}</td>
                <td class="px-4 py-3">
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-medium inline-block"
                    :class="detectType(it) === 'Drug' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'"
                  >
                    {{ detectType(it) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-gray-700">{{ it.quantity ?? '-' }}</td>
                <td class="px-4 py-3 text-right text-gray-700">{{ formatCurrency(it.unitPrice) }}</td>
                <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(it.totalPrice) }}</td>
              </tr>
            </tbody>

            <tfoot v-if="localItems.length" class="bg-gray-50">
              <tr>
                <td colspan="7" class="px-4 py-3 text-right text-sm text-gray-600">Total</td>
                <td class="px-4 py-3 text-right font-semibold">{{ formatCurrency(total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- <div class="mt-4">
          <label class="block text-sm text-gray-600 mb-2">Remark (optional)</label>
          <textarea v-model="remark" rows="2" class="w-full p-2 border rounded text-sm" placeholder="Add a remark (optional)"></textarea>
        </div> -->
      </div>

      <div class="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
        <div class="text-sm text-gray-600">Items: <span class="font-medium">{{ localItems.length }}</span></div>
        <!-- <div class="flex items-center gap-3">
          <Button type="danger" @click="performAction('REJECTED')" :pending="req.pending.value">Reject</Button>
          <Button type="primary" @click="performAction('CHECKED')" :pending="req.pending.value">Checked</Button>
        </div> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-badge { display: inline-block; padding: .125rem .5rem; border-radius: 9999px; font-size: .75rem; }
</style>