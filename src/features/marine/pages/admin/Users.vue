<script setup>
// Marine users (plan 4.5): list with role and status filters; the user modal creates and edits;
// disable and enable go through a confirmation.
import { computed } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { useAuthStore } from "@/stores/auth";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { cardClass } from "../../components/styles";
import { useListQuery } from "../../composables/useListQuery";
import { listUsers, setUserEnabled } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { ROLE_LABELS, ROLES } from "../../constants";
import { formatDateTime } from "../../utils/format";
import { useMarineConfig } from "../../composables/useMarineConfig";
import { settingsFacts } from "../../utils/settingsView";

const marineConfig = useMarineConfig();
const facts = computed(() => settingsFacts(marineConfig.value));
const auth = useAuthStore();
const selfUsername = computed(() => {
  const u = auth.auth?.user ?? auth.auth;
  return u?.username ?? u?.userName ?? u?.email ?? "";
});

const list = useListQuery(listUsers, { filters: { q: "", role: "", status: "" }, sort: "username,asc" });

function edit(user) {
  openModal("MarineUserForm", { user, selfUsername: selfUsername.value }, (saved) => saved && list.load());
}

function toggle(user) {
  const enable = !user.enabled;
  openModal(
    "MarineConfirm",
    {
      title: `${enable ? "Enable" : "Disable"} ${user.fullName}?`,
      message: enable ? `${user.username} will be able to sign in again.` : `${user.username} won't be able to sign in until enabled again. Their records stay as they are.`,
      confirmLabel: enable ? "Enable" : "Disable",
      danger: !enable,
    },
    async (r) => {
      if (!r?.confirmed) return;
      const res = await setUserEnabled(user.id, enable);
      if (res.ok) {
        toasted(true, `${user.username} ${enable ? "enabled" : "disabled"}`);
        list.load();
      } else notifyError(res.error);
    }
  );
}

const columns = [
  { key: "username", label: "Username", sortable: true },
  { key: "fullName", label: "Full name", sortable: true },
  { key: "email", label: "Email" },
  { key: "roles", label: "Roles" },
  { key: "status", label: "Status" },
  { key: "lastSignInAt", label: "Last sign-in", sortable: true },
  { key: "actions", label: "" },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Marine users and roles" subtitle="The same sign-in as the rest of the platform. Marine roles sit on top of it." :crumbs="[{ label: 'Marine' }, { label: 'Marine Settings' }, { label: 'Users and roles' }]">
      <template #actions>
        <Button @click="edit(null)">New user</Button>
      </template>
    </MarinePageHeader>
    <p role="status" class="p-4 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">
      <template v-if="facts.rolesEnforce">Marine role enforcement is on. A role-gated action requires one of the Marine roles. </template>
      <template v-else>Marine role enforcement is off until users are provisioned. A caller with no Marine role still passes the platform privilege check. A caller who already has a Marine role is limited to that role. </template>
      Broker-only callers see only their own party. That isolation stays on. Authority amounts are the reference matrix on Underwriting rules. They are not approved limits.
    </p>
    <section :class="[cardClass, 'p-4 mb-4']" aria-labelledby="role-legend">
      <h2 id="role-legend" class="mb-2 text-sm font-semibold text-ink">Roles already on this module</h2>
      <ul class="grid gap-2 text-sm sm:grid-cols-2">
        <li><span class="font-medium text-ink">Broker.</span> Proposals and quotations. Own party only.</li>
        <li><span class="font-medium text-ink">Underwriter.</span> Reviews a referral on the quotation.</li>
        <li><span class="font-medium text-ink">Senior underwriter.</span> The authority a referral asks for above the reference limit. Can edit a draft rate table.</li>
        <li><span class="font-medium text-ink">Finance.</span> Enters FX rates.</li>
        <li><span class="font-medium text-ink">Claims handler and claims manager.</span> Claim files and claim deadlines.</li>
        <li><span class="font-medium text-ink">Admin.</span> Rules, users, master data, and the sanctions list.</li>
      </ul>
    </section>
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search username, name or email' },
        { type: 'select', key: 'role', label: 'Role', options: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })) },
        { type: 'select', key: 'status', label: 'Status', options: [{ value: 'ENABLED', label: 'Enabled' }, { value: 'DISABLED', label: 'Disabled' }] },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" empty-title="No users yet">
      <template #cell-username="{ row }">
        <button type="button" class="font-semibold text-left text-ink hover:text-primary" @click="edit(row)">{{ row.username }}</button>
      </template>
      <template #cell-roles="{ row }">
        <span class="flex flex-wrap gap-1">
          <span v-for="r in row.roles" :key="r" class="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">{{ ROLE_LABELS[r] }}</span>
        </span>
      </template>
      <template #cell-status="{ row }"><StatusBadge entity="user" :status="row.enabled ? 'ENABLED' : 'DISABLED'" /></template>
      <template #cell-lastSignInAt="{ row }"><span :class="row.lastSignInAt ? '' : 'text-ink-subtle'">{{ row.lastSignInAt ? formatDateTime(row.lastSignInAt) : "Never" }}</span></template>
      <template #cell-actions="{ row }">
        <button v-if="row.username !== selfUsername" type="button" class="text-sm font-medium text-primary hover:underline" @click="toggle(row)">{{ row.enabled ? "Disable" : "Enable" }}</button>
      </template>
    </ListTable>
  </div>
</template>
