<script setup>
// Settlement (plan 8.3, MAR-46): reserve (editable by the handler), approved amount, deductible,
// less salvage and recoveries, net payable, payee and payment history.
import { computed, ref } from "vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MoneyInput from "../MoneyInput.vue";
import StatusBadge from "../StatusBadge.vue";
import { cardClass } from "../styles";
import { updateReserve } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { add, formatMoney, toFixedString } from "../../utils/money";
import { formatDateTime } from "../../utils/format";

const props = defineProps({ claim: { type: Object, required: true }, canWork: { type: Boolean, default: false } });
const emit = defineEmits(["updated"]);
const reserve = ref(props.claim.reserve ?? "");
const saving = ref(false);
const m = computed(() => props.claim.money);
const deductible = computed(() => props.claim.deductible ?? "0");
const approved = computed(() => props.claim.reserve ?? "0");
const netPayable = computed(() => toFixedString(add(approved.value, `-${deductible.value}`, `-${m.value.recovered}`)));

async function saveReserve() {
  saving.value = true;
  const res = await updateReserve(props.claim.id, reserve.value);
  saving.value = false;
  if (res.ok) {
    toasted(true, "Reserve updated");
    emit("updated", res.data);
  } else notifyError(res.error);
}
</script>

<template>
  <div class="grid gap-4 max-w-3xl">
    <section :class="[cardClass, 'p-4']">
      <h3 class="mb-3 text-sm font-semibold text-ink">Reserve</h3>
      <div class="flex flex-wrap gap-2 items-center">
        <MoneyInput v-model:amount="reserve" :currency="claim.currency" lock-currency :class="'w-64'" :aria-label="'Reserve'" />
        <Button v-if="canWork && !['PAYMENT_REQUESTED', 'PAID', 'CLOSED', 'DECLINED'].includes(claim.status)" variant="outline" :pending="saving" :disabled="!reserve" @click="saveReserve">Save reserve</Button>
      </div>
    </section>
    <section :class="[cardClass, 'p-4']">
      <dl class="grid grid-cols-2 gap-y-2 text-sm">
        <dt class="text-ink-muted">Approved amount</dt><dd class="text-right tabular-nums">{{ formatMoney(approved, claim.currency) }}</dd>
        <dt class="text-ink-muted">Less deductible</dt><dd class="text-right tabular-nums">{{ formatMoney(deductible, claim.currency) }}</dd>
        <dt class="text-ink-muted">Less recoveries</dt><dd class="text-right tabular-nums">{{ formatMoney(m.recovered, claim.currency) }}</dd>
        <dt class="text-ink-muted">GA and salvage (paid separately)</dt><dd class="text-right tabular-nums">{{ formatMoney(m.gaSalvage, claim.currency) }}</dd>
        <dt class="pt-2 font-semibold border-t text-ink border-line">Net payable</dt><dd class="pt-2 font-semibold text-right tabular-nums border-t border-line">{{ formatMoney(netPayable, claim.currency) }}</dd>
        <dt class="text-ink-muted">Payee</dt><dd class="text-right">{{ claim.payee?.name }}</dd>
      </dl>
    </section>
    <section v-if="claim.vouchers?.length" :class="[cardClass, 'p-4']">
      <h3 class="mb-2 text-sm font-semibold text-ink">Payment requests to Finance</h3>
      <ul class="space-y-1 text-sm">
        <li v-for="v in claim.vouchers" :key="v.id" class="flex flex-wrap gap-2 justify-between items-center">
          <span><span class="font-semibold">{{ v.voucherNo }}</span> · {{ formatMoney(v.amount, claim.currency) }} to {{ v.payee?.name }}</span>
          <span class="flex gap-2 items-center text-ink-muted">{{ v.requestedBy }}, {{ formatDateTime(v.requestedAt) }} <StatusBadge entity="voucher" :status="v.status" /></span>
        </li>
      </ul>
    </section>
    <section :class="[cardClass, 'p-4']">
      <h3 class="mb-2 text-sm font-semibold text-ink">Payments</h3>
      <p v-if="!claim.payments.length" class="text-sm text-ink-subtle">No payments yet.</p>
      <ul v-else class="space-y-1 text-sm">
        <li v-for="p in claim.payments" :key="p.id" class="flex flex-wrap gap-2 justify-between">
          <span>{{ formatMoney(p.amount, claim.currency) }} · reference {{ p.paymentRef }} · export {{ p.exportRef }}</span>
          <span class="text-ink-muted">{{ p.paidBy }}, {{ formatDateTime(p.paidAt) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
