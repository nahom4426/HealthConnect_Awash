<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { formatCurrency, toasted } from "@/utils/utils";
import { hasPrivilege } from "@/utils/privileges";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import RateTableEditor from "../../components/RateTableEditor.vue";
import { fileForm, useLifeResource } from "../../composables/useLifeResource";
import { groupRiderSpec, individualRiderSpec } from "../../rates/rateTables";
import { PolicyStatus } from "../../constants/statuses";
import {
  activateRider, deactivateRider, deleteGroupRider, deleteIndividualRider, deleteRider, getPendingRiders, getRider,
  importData, importGroupRiderData, modifyRider, reactivateRider, updateGroupRiders, updateIndividualRiders,
} from "../../api/productApi";

const route = useRoute();
const router = useRouter();
const riderUuid = computed(() => route.params.riderUuid);

const { data: rider, loading, error, load } = useLifeResource(getRider);
watch(riderUuid, (id) => id && load(id), { immediate: true });
const reload = () => load(riderUuid.value);

// A revision draft links back to the version it will replace
const original = useLifeResource(getRider);
watch(() => rider.value?.revisedFromRiderUuid, (id) => { original.data.value = null; if (id) original.load(id); }, { immediate: true });
// An active rider can have one open revision at a time: offer to open it instead of revising again
const drafts = useLifeResource(getPendingRiders, { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
watch(() => rider.value?.status === PolicyStatus.ACTIVE && rider.value.riderUuid, (id) => id && drafts.load(), { immediate: true });
const openRevision = computed(() => drafts.data.value.find((d) => d.revisedFromRiderUuid === riderUuid.value) || null);

// Activate, deactivate and reactivate are rider updates on the backend (life.rider.update)
const canChangeStatus = computed(() => hasPrivilege(["Life_Product_Manage", "life.rider.update"]));
const riderName = computed(() => rider.value?.riderName || "this rider");

const tab = ref("Individual rates");
// Rates can change only on a pending version; an active rider is changed by revising it
const editable = computed(() => rider.value?.status === PolicyStatus.PENDING);

const TABLES = {
  "Individual rates": { spec: individualRiderSpec, rows: "individualRiders", save: updateIndividualRiders, remove: deleteIndividualRider, importer: importData },
  "Group rates": { spec: groupRiderSpec, rows: "groupRiders", save: updateGroupRiders, remove: deleteGroupRider, importer: importGroupRiderData },
};
const current = computed(() => TABLES[tab.value]);
const saving = ref(false);
const importing = ref(false);

async function saveRates(payload) {
  saving.value = true;
  const res = await current.value.save(payload);
  saving.value = false;
  if (res?.success) {
    toasted(true, `${tab.value} saved`);
    await reload();
  }
}

function removeRate(row) {
  confirm({ title: "Delete this rate row?", message: "It is removed from the rider's rate table.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await current.value.remove(row[current.value.spec.idField]);
    if (res?.success) {
      toasted(true, "Row deleted");
      await reload();
    }
  });
}

async function importRates(file) {
  importing.value = true;
  const res = await current.value.importer(fileForm(file), { riderUuid: riderUuid.value });
  importing.value = false;
  if (res?.success) {
    toasted(true, `${file.name} imported`);
    await reload();
  }
}

function confirm(data, onYes) {
  openModal("Confirmation", { cancelText: "Cancel", ...data }, (yes) => yes && onYes());
}

function edit() {
  openModal("LifeRiderForm", { rider: rider.value }, (saved) => saved && reload());
}

function activate() {
  confirm(
    { title: "Activate this rider?", message: "It becomes available for new quotations and policies at these rates. Make sure both rate tables are complete.", confirmText: "Activate" },
    async () => {
      const res = await activateRider(riderUuid.value);
      if (res?.success) {
        toasted(true, "Rider activated");
        if (res.data?.riderUuid && res.data.riderUuid !== riderUuid.value) router.replace(`/life/products/riders/${res.data.riderUuid}`);
        else reload();
      }
    }
  );
}

function revise() {
  confirm(
    { title: "Revise this rider?", message: "A new draft version is created for you to edit. When you activate it, it replaces this one; quotations and policies that already have this version keep it.", confirmText: "Create revision" },
    async () => {
      const res = await modifyRider(riderUuid.value);
      if (res?.success && res.data?.riderUuid) {
        toasted(true, "Revision created");
        router.push(`/life/products/riders/${res.data.riderUuid}`);
      }
    }
  );
}

function deactivate() {
  confirm(
    { title: `Deactivate ${riderName.value}?`, message: "It can no longer be added to new quotations or policies. Quotations and policies that already have it keep it, at its current rates.", confirmText: "Deactivate", tone: "danger" },
    async () => {
      const res = await deactivateRider(riderUuid.value);
      if (res?.success) toasted(true, "Rider deactivated");
      reload();
    }
  );
}

function reactivate() {
  confirm(
    { title: `Reactivate ${riderName.value}?`, message: "It can be added to new quotations and policies again, at the same rates.", confirmText: "Reactivate" },
    async () => {
      const res = await reactivateRider(riderUuid.value);
      if (res?.success) toasted(true, "Rider reactivated");
      reload();
    }
  );
}

function remove() {
  confirm(
    { title: `Delete ${rider.value?.riderName || "this rider"}?`, message: "The rider and its rate tables are deleted. This can't be undone.", confirmText: "Delete rider", tone: "danger" },
    async () => {
      const res = await deleteRider(riderUuid.value);
      if (res?.success) {
        toasted(true, "Rider deleted");
        router.push("/life/products/riders");
      }
    }
  );
}

const money = (v) => (v === null || v === undefined ? "—" : formatCurrency(v));
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="error && !loading" class="flex flex-col gap-3 items-center px-6 py-16 text-center rounded-2xl border bg-surface border-line">
      <p class="text-sm font-semibold text-ink">Couldn't load this rider</p>
      <p class="max-w-md text-sm text-ink-muted">{{ error }}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="reload">Try again</Button>
        <Button variant="ghost" size="sm" @click="router.push('/life/products/riders')">Back to riders</Button>
      </div>
    </div>

    <template v-else>
      <PageHeader :title="rider?.riderName || (loading ? 'Loading rider…' : 'Rider')" :subtitle="rider?.riderDescription" back="/life/products/riders">
        <template #badge><StatusBadge v-if="rider" :status="rider.status" /></template>
        <template v-if="rider" #actions>
          <template v-if="rider.status === 'PENDING'">
            <Button variant="outline" @click="edit">Edit details</Button>
            <Button variant="destructive" @click="remove">Delete</Button>
            <Button v-if="canChangeStatus" @click="activate">Activate</Button>
          </template>
          <template v-else-if="rider.status === 'ACTIVE'">
            <Button v-if="canChangeStatus" variant="outline" @click="deactivate">Deactivate</Button>
            <Button v-if="openRevision" @click="router.push(`/life/products/riders/${openRevision.riderUuid}`)">Open revision</Button>
            <Button v-else @click="revise">Revise</Button>
          </template>
          <Button v-else-if="rider.status === 'DISABLED' && canChangeStatus" @click="reactivate">Reactivate</Button>
        </template>
      </PageHeader>

      <dl v-if="rider" class="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">
        <div class="px-4 py-3 rounded-2xl border bg-surface border-line">
          <dt class="text-xs text-ink-subtle">Minimum sum assured</dt>
          <dd class="mt-1 text-base font-semibold tabular-nums text-ink">{{ money(rider.minLimit) }}</dd>
        </div>
        <div class="px-4 py-3 rounded-2xl border bg-surface border-line">
          <dt class="text-xs text-ink-subtle">Maximum sum assured</dt>
          <dd class="mt-1 text-base font-semibold tabular-nums text-ink">{{ money(rider.maxLimit) }}</dd>
        </div>
        <div class="px-4 py-3 rounded-2xl border bg-surface border-line">
          <dt class="text-xs text-ink-subtle">Individual rate rows</dt>
          <dd class="mt-1 text-base font-semibold tabular-nums text-ink">{{ rider.individualRiders?.length ?? 0 }}</dd>
        </div>
        <div class="px-4 py-3 rounded-2xl border bg-surface border-line">
          <dt class="text-xs text-ink-subtle">Group rate rows</dt>
          <dd class="mt-1 text-base font-semibold tabular-nums text-ink">{{ rider.groupRiders?.length ?? 0 }}</dd>
        </div>
      </dl>

      <p v-if="rider?.revisedFromRiderUuid" class="flex flex-wrap gap-x-1 items-center px-4 py-3 mb-4 text-sm rounded-xl bg-primary/5 text-ink-muted">
        Revision of
        <RouterLink :to="`/life/products/riders/${rider.revisedFromRiderUuid}`" class="font-semibold text-primary hover:underline">{{ original.data.value?.riderName || "the earlier version" }}</RouterLink>
        <StatusBadge v-if="original.data.value" :status="original.data.value.status" class="ml-1" />
        <span v-if="editable">· Activating it replaces that version.</span>
      </p>

      <p v-if="rider && !editable" class="flex gap-2 items-start px-4 py-3 mb-4 text-sm rounded-xl bg-surface-muted text-ink-muted">
        <svg class="mt-0.5 w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="7.5" /><path d="M10 9v4.5M10 6.5h.01" stroke-linecap="round" /></svg>
        <span v-if="rider.status === 'ACTIVE' && openRevision">This version is in use, so its rates are read-only. Its changes are being prepared in an <strong class="text-ink">open revision</strong>.</span>
        <span v-else-if="rider.status === 'ACTIVE'">This version is in use, so its rates are read-only. Choose <strong class="text-ink">Revise</strong> to change them.</span>
        <span v-else-if="rider.status === 'DISABLED'">Deactivated: it can't be added to new quotations or policies. Quotations and policies that already have it keep it, at these rates.</span>
        <span v-else-if="rider.status === 'MODIFIED'">Replaced by a newer version. Quotations and policies that already have it keep it.</span>
        <span v-else>This version is kept for reference.</span>
      </p>

      <TabGroup v-model="tab" :tabs="Object.keys(TABLES)" class="mb-4" />
      <RateTableEditor
        :key="tab"
        :spec="current.spec"
        :rows="rider?.[current.rows] || []"
        :loading="loading && !rider"
        :saving="saving"
        :importing="importing"
        :readonly="!editable"
        :extra="{ riderUuid }"
        :default-status="PolicyStatus.ACTIVE"
        importable
        @save="saveRates"
        @remove="removeRate"
        @import="importRates"
      />
    </template>
  </div>
</template>
