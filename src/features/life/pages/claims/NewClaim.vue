<script setup>
// Start a claim: find the member's group policy, pick the member, create the draft.
// POST /claim only takes the member (gap G3): the event details go in the documents and the
// submission comment until the backend accepts them.
import { ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { PolicyStatus } from "../../constants/statuses";
import { formatAmount, formatDate } from "../../constants/labels";
import { insuredName } from "../../quotations/quotationRules";
import { getPolicies } from "../../api/policyApi";
import { getInsuredPersons } from "../../api/quotationApi";
import { createClaim } from "../../api/claimApi";

const router = useRouter();

const policies = useLifePagedList(getPolicies, { status: PolicyStatus.ACTIVE, limit: 8 });
policies.reload();
const policy = ref(null);

// shallowRef: the paged list is an object of refs and must not be unwrapped
const memberList = shallowRef(null);
function choosePolicy(p) {
  policy.value = p;
  memberList.value = useLifePagedList((params) => getInsuredPersons(p.quotationUuid, params), { limit: 10 });
  memberList.value.reload();
  member.value = null;
}
function changePolicy() {
  policy.value = null;
  memberList.value = null;
  member.value = null;
}

const member = ref(null);
const creating = ref(false);
async function create() {
  if (!member.value) return;
  creating.value = true;
  const res = await createClaim({ insuredPersonUuid: member.value.insuredUuid });
  creating.value = false;
  if (!res?.success) return;
  const claimUuid = typeof res.data === "string" ? res.data.replace(/"/g, "") : res.data?.claimUuid;
  toasted(true, "Draft claim created. Add the documents, then submit it.");
  router.push(claimUuid ? { path: `/life/claims/${claimUuid}`, query: { side: "agency", queue: "saved" } } : { path: "/life/claims/agency", query: { queue: "saved" } });
}

const search = "px-3 w-full sm:w-80 h-9 text-sm rounded-lg border outline-none bg-surface-muted border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader title="New claim" back="/life/claims/agency" subtitle="Find the member's group policy and choose the member. You'll add the documents on the next page." />

    <ol class="grid gap-5 max-w-4xl">
      <!-- 1 · Policy -->
      <li class="p-5 rounded-2xl border bg-surface border-line shadow-card">
        <div class="flex gap-3 justify-between items-center">
          <h2 class="flex gap-2 items-center text-sm font-semibold text-ink">
            <span :class="['grid place-items-center w-6 h-6 text-xs rounded-full', policy ? 'bg-success text-white' : 'bg-primary text-white']">{{ policy ? "✓" : 1 }}</span>
            Policy
          </h2>
          <button v-if="policy" type="button" class="text-xs font-semibold text-primary hover:underline" @click="changePolicy">Change</button>
        </div>
        <p v-if="policy" class="mt-2 text-sm text-ink">
          {{ policy.institutionLifeInsuranceNumber || policy.quotationNumber }} · {{ policy.institutionName }}
          <span class="text-ink-subtle">· cover {{ formatDate(policy.beginDate) }} – {{ formatDate(policy.endDate) }}</span>
        </p>
        <template v-else>
          <input v-model="policies.search.value" v-focus="true" type="search" placeholder="Search policy number or institution" aria-label="Search active policies" :class="[search, 'mt-3']" />
          <p v-if="policies.error.value" class="mt-3 text-sm text-ink-muted">{{ policies.error.value }} <button type="button" class="font-semibold text-primary" @click="policies.reload()">Try again</button></p>
          <ul v-else class="mt-3 rounded-xl border divide-y border-line divide-line">
            <li v-if="policies.loading.value" class="px-4 py-3 text-sm text-ink-subtle">Loading active policies…</li>
            <li v-else-if="!policies.rows.value.length" class="px-4 py-3 text-sm text-ink-subtle">No active policies{{ policies.search.value ? " match your search" : "" }}.</li>
            <li v-for="p in policies.rows.value" v-else :key="p.quotationUuid">
              <button type="button" class="flex gap-3 justify-between items-center px-4 py-2.5 w-full text-left hover:bg-surface-muted focus:bg-surface-muted focus:outline-none" @click="choosePolicy(p)">
                <span class="text-sm">
                  <span class="font-medium text-ink">{{ p.institutionName }}</span>
                  <span class="block text-xs text-ink-subtle">{{ p.institutionLifeInsuranceNumber || p.quotationNumber }} · {{ formatDate(p.beginDate) }} – {{ formatDate(p.endDate) }}</span>
                </span>
                <LifeStatusBadge :status="p.policyStatus" />
              </button>
            </li>
          </ul>
          <LifePager v-model:page="policies.page.value" :total-pages="policies.totalPages.value" :disabled="policies.loading.value" />
        </template>
      </li>

      <!-- 2 · Member -->
      <li :class="['p-5 rounded-2xl border bg-surface border-line shadow-card', !policy && 'opacity-60']">
        <h2 class="flex gap-2 items-center text-sm font-semibold text-ink">
          <span :class="['grid place-items-center w-6 h-6 text-xs rounded-full', member ? 'bg-success text-white' : policy ? 'bg-primary text-white' : 'bg-surface-raised text-ink-subtle']">{{ member ? "✓" : 2 }}</span>
          Member
        </h2>
        <template v-if="memberList">
          <input v-model="memberList.search.value" type="search" placeholder="Search name, phone or insurance ID" aria-label="Search members" :class="[search, 'mt-3']" />
          <p v-if="memberList.error.value" class="mt-3 text-sm text-ink-muted">{{ memberList.error.value }}</p>
          <ul v-else role="radiogroup" aria-label="Member" class="mt-3 rounded-xl border divide-y border-line divide-line">
            <li v-if="memberList.loading.value" class="px-4 py-3 text-sm text-ink-subtle">Loading members…</li>
            <li v-else-if="!memberList.rows.value.length" class="px-4 py-3 text-sm text-ink-subtle">No members{{ memberList.search.value ? " match your search" : " on this policy" }}.</li>
            <li v-for="m in memberList.rows.value" v-else :key="m.insuredUuid">
              <label :class="['flex gap-3 items-center px-4 py-2.5 cursor-pointer hover:bg-surface-muted', member?.insuredUuid === m.insuredUuid && 'bg-primary/5']">
                <input type="radio" name="member" class="accent-primary" :checked="member?.insuredUuid === m.insuredUuid" @change="member = m" />
                <span class="flex-1 text-sm">
                  <span class="font-medium text-ink">{{ insuredName(m) }}</span>
                  <span class="block text-xs text-ink-subtle">{{ [m.insuranceId, m.phone, `born ${formatDate(m.birthDate)}`].filter(Boolean).join(" · ") }}</span>
                </span>
                <span class="text-xs text-right tabular-nums text-ink-muted">Sum assured<br /><span class="text-sm text-ink">{{ formatAmount(m.sumAssured) }}</span></span>
              </label>
            </li>
          </ul>
          <LifePager v-model:page="memberList.page.value" :total-pages="memberList.totalPages.value" :disabled="memberList.loading.value" />
        </template>
        <p v-else class="mt-2 text-sm text-ink-subtle">Choose the policy first.</p>
      </li>

      <!-- 3 · Create -->
      <li class="flex flex-wrap gap-4 justify-between items-center p-5 rounded-2xl border bg-surface border-line shadow-card">
        <p class="max-w-xl text-xs text-ink-muted">
          The system doesn't take the claim type, event date or claimed amount yet. Attach the death certificate or medical report on the next page and describe the event when you submit.
        </p>
        <Button :disabled="!member" :pending="creating" @click="create">Create draft claim</Button>
      </li>
    </ol>
  </div>
</template>
