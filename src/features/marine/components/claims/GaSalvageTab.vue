<script setup>
// General average and salvage records (plan 8.3, MAR-43); the amounts roll into the money strip.
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import PageState from "../PageState.vue";
import { cardClass } from "../styles";
import { formatMoney } from "../../utils/money";
import { formatDate } from "../../utils/format";

const props = defineProps({ claim: { type: Object, required: true }, canWork: { type: Boolean, default: false } });
const emit = defineEmits(["updated"]);
const add = (kind, record = null) => openModal("MarineClaimRecord", { claim: props.claim, kind, record }, (c) => c && emit("updated", c));
const SECURITY = { GA_BOND: "GA bond", GUARANTEE: "Guarantee" };
</script>

<template>
  <div class="grid gap-4">
    <section :class="[cardClass, 'overflow-hidden']">
      <div class="flex justify-between items-center px-4 pt-4 pb-2">
        <h3 class="text-sm font-semibold text-ink">General average</h3>
        <Button v-if="canWork" size="sm" variant="outline" @click="add('GA')">Add general average</Button>
      </div>
      <PageState v-if="!claim.ga.length" kind="empty" title="No general average declared" />
      <table v-else class="w-full text-sm">
        <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-4 py-2">Declared</th><th class="px-4 py-2">Adjuster</th><th class="px-4 py-2">Security</th><th class="px-4 py-2 text-right">Security amount</th><th class="px-4 py-2 text-right">Contribution</th><th class="px-4 py-2"></th></tr></thead>
        <tbody>
          <tr v-for="g in claim.ga" :key="g.id" class="border-t border-line">
            <td class="px-4 py-2">{{ formatDate(g.declarationDate) }}</td>
            <td class="px-4 py-2">{{ g.adjuster?.name }}</td>
            <td class="px-4 py-2">{{ SECURITY[g.securityType] }}</td>
            <td class="px-4 py-2 text-right tabular-nums">{{ formatMoney(g.securityAmount, claim.currency) }}</td>
            <td class="px-4 py-2 text-right tabular-nums">{{ formatMoney(g.contributionAmount, claim.currency) }}</td>
            <td class="px-4 py-2 text-right"><button v-if="canWork" type="button" class="text-sm font-medium text-primary hover:underline" @click="add('GA', g)">Edit</button></td>
          </tr>
        </tbody>
      </table>
    </section>
    <section :class="[cardClass, 'overflow-hidden']">
      <div class="flex justify-between items-center px-4 pt-4 pb-2">
        <h3 class="text-sm font-semibold text-ink">Salvage</h3>
        <Button v-if="canWork" size="sm" variant="outline" @click="add('SALVAGE')">Add salvage</Button>
      </div>
      <PageState v-if="!claim.salvage.length" kind="empty" title="No salvage recorded" />
      <table v-else class="w-full text-sm">
        <thead class="bg-surface-muted"><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="px-4 py-2">Salvor</th><th class="px-4 py-2 text-right">Award or charges</th><th class="px-4 py-2">Security</th><th class="px-4 py-2">Notes</th><th class="px-4 py-2"></th></tr></thead>
        <tbody>
          <tr v-for="x in claim.salvage" :key="x.id" class="border-t border-line">
            <td class="px-4 py-2">{{ x.salvor?.name }}</td>
            <td class="px-4 py-2 text-right tabular-nums">{{ formatMoney(x.amount, claim.currency) }}</td>
            <td class="px-4 py-2">{{ x.security || "—" }}</td>
            <td class="px-4 py-2 text-ink-muted">{{ x.notes || "—" }}</td>
            <td class="px-4 py-2 text-right"><button v-if="canWork" type="button" class="text-sm font-medium text-primary hover:underline" @click="add('SALVAGE', x)">Edit</button></td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
