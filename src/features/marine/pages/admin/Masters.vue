<script setup>
// Admin masters (plan 4.3): vessels, ports, commodities and parties. Each tab is a filtered,
// server-paged list; New and row click open the form modal (edit mode shows change history).
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import MastersTab from "./MastersTab.vue";
import { useCan } from "../../composables/useCan";

const route = useRoute();
const router = useRouter();
const { can } = useCan();

const TABS = [
  { key: "vessels", label: "Vessels" },
  { key: "ports", label: "Ports" },
  { key: "commodities", label: "Commodities" },
  { key: "parties", label: "Parties" },
];
const tab = computed(() => (TABS.some((t) => t.key === route.query.tab) ? route.query.tab : "vessels"));
// Each tab keeps its own filters, so switching drops the old tab's query
const select = (key) => router.replace({ query: { tab: key } });

const NEW = {
  vessels: ["MarineVesselForm", "New vessel"],
  ports: ["MarinePortForm", "New port"],
  commodities: ["MarineCommodityForm", "New commodity"],
  parties: ["MarinePartyForm", "New party"],
};
let reloadTab = () => {};
function create() {
  openModal(NEW[tab.value][0], {}, (saved) => saved && reloadTab());
}
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Masters" subtitle="Reference data every quote picks from. Only admins can change it; everyone else sees it through the pickers." :crumbs="[{ label: 'Marine' }, { label: 'Admin' }, { label: 'Masters' }]">
      <template #actions>
        <Button v-if="can('masters.edit')" @click="create">{{ NEW[tab][1] }}</Button>
      </template>
    </MarinePageHeader>

    <div role="tablist" aria-label="Masters" class="flex gap-1 mb-4 border-b border-line">
      <button
        v-for="t in TABS"
        :key="t.key"
        role="tab"
        type="button"
        :aria-selected="tab === t.key"
        :class="['px-4 py-2 -mb-px text-sm font-medium border-b-2', tab === t.key ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink']"
        @click="select(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <MastersTab :key="tab" :kind="tab" :editable="can('masters.edit')" @ready="(fn) => (reloadTab = fn)" @create="create" />
  </div>
</template>
