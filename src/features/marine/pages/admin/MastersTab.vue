<script setup>
// One masters tab: its filters, columns and form modal.
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import { useListQuery } from "../../composables/useListQuery";
import { listCommodities, listParties, listPorts, listVessels } from "../../api/marineApi";
import { FLAG_STATES, PARTY_TYPES, partyTypeLabel } from "../../constants";

const props = defineProps({
  kind: { type: String, required: true },
  editable: { type: Boolean, default: false },
});
const emit = defineEmits(["ready", "create"]);

const CLASSES = ["GENERAL", "BULK", "MACHINERY", "ELECTRONICS", "VEHICLES", "PHARMA", "PERISHABLE", "DANGEROUS"].map((v) => ({ value: v, label: v.charAt(0) + v.slice(1).toLowerCase() }));

const CONFIG = {
  vessels: {
    fetch: listVessels,
    filters: { q: "", flag: "", minAge: "", maxAge: "" },
    sort: "name,asc",
    fields: [
      { type: "search", key: "q", label: "Search IMO or name" },
      { type: "select", key: "flag", label: "Flag", options: FLAG_STATES.map((f) => ({ value: f, label: f })) },
    ],
    columns: [
      { key: "imo", label: "IMO", sortable: true },
      { key: "name", label: "Name", sortable: true, class: "whitespace-nowrap" },
      { key: "flag", label: "Flag", sortable: true },
      { key: "yearBuilt", label: "Year built", sortable: true, align: "right" },
      { key: "age", label: "Age", align: "right", class: "whitespace-nowrap" },
      { key: "classSociety", label: "Class society" },
      { key: "source", label: "Source" },
    ],
    modal: "MarineVesselForm",
    payload: (row) => ({ vessel: row }),
    rowKey: "imo",
    empty: "No vessels yet",
    newLabel: "New vessel",
  },
  ports: {
    fetch: listPorts,
    filters: { q: "", country: "" },
    sort: "code,asc",
    fields: [{ type: "search", key: "q", label: "Search code, name or country" }],
    columns: [
      { key: "code", label: "UN/LOCODE", sortable: true },
      { key: "name", label: "Name", sortable: true },
      { key: "country", label: "Country", sortable: true },
    ],
    modal: "MarinePortForm",
    payload: (row) => ({ port: row }),
    rowKey: "code",
    empty: "No ports yet",
    newLabel: "New port",
  },
  commodities: {
    fetch: listCommodities,
    filters: { q: "", commodityClass: "", restricted: "" },
    sort: "hsCode,asc",
    fields: [
      { type: "search", key: "q", label: "Search HS code or description" },
      { type: "select", key: "commodityClass", label: "Class", options: CLASSES },
      { type: "toggle", key: "restricted", label: "Restricted only" },
    ],
    columns: [
      { key: "hsCode", label: "HS code", sortable: true },
      { key: "description", label: "Description", sortable: true },
      { key: "commodityClass", label: "Class", sortable: true },
      { key: "restricted", label: "Restricted" },
    ],
    modal: "MarineCommodityForm",
    payload: (row) => ({ commodity: row }),
    rowKey: "hsCode",
    empty: "No commodities yet",
    newLabel: "New commodity",
  },
  parties: {
    fetch: listParties,
    filters: { q: "", type: "" },
    sort: "name,asc",
    fields: [
      { type: "search", key: "q", label: "Search name, TIN or email" },
      { type: "select", key: "type", label: "Type", options: PARTY_TYPES.map((t) => ({ value: t, label: partyTypeLabel(t) })) },
    ],
    columns: [
      { key: "name", label: "Name", sortable: true },
      { key: "types", label: "Type" },
      { key: "tin", label: "TIN" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
    ],
    modal: "MarinePartyForm",
    payload: (row) => ({ party: row }),
    rowKey: "id",
    empty: "No parties yet",
    newLabel: "New party",
  },
};

const cfg = CONFIG[props.kind];
const list = useListQuery(cfg.fetch, { filters: cfg.filters, sort: cfg.sort });
emit("ready", () => list.load());

function open(row) {
  if (!props.editable) return;
  openModal(cfg.modal, cfg.payload(row), (saved) => saved && list.load());
}
</script>

<template>
  <div>
    <FilterBar :fields="cfg.fields" :list="list" />
    <ListTable :columns="cfg.columns" :list="list" :row-key="cfg.rowKey" :empty-title="cfg.empty">
      <template v-for="c in cfg.columns" :key="c.key" #[`cell-${c.key}`]="{ row }">
        <button v-if="c === cfg.columns[0] && editable" type="button" class="font-semibold text-left text-ink hover:text-primary" @click="open(row)">{{ row[c.key] }}</button>
        <span v-else-if="c.key === 'types'" class="flex flex-wrap gap-1">
          <span v-for="t in row.types" :key="t" class="px-2 py-0.5 text-xs rounded-full bg-surface-raised text-ink-muted">{{ partyTypeLabel(t) }}</span>
        </span>
        <span v-else-if="c.key === 'restricted'">
          <span v-if="row.restricted" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Restricted</span>
          <span v-else class="text-ink-subtle">No</span>
        </span>
        <span v-else-if="c.key === 'commodityClass'">{{ row.commodityClass.charAt(0) + row.commodityClass.slice(1).toLowerCase() }}</span>
        <span v-else-if="c.key === 'source'">{{ row.source === "LOOKUP" ? "Lookup" : "Manual" }}</span>
        <span v-else-if="c.key === 'age'">{{ row.age }} y</span>
        <span v-else :class="row[c.key] ? '' : 'text-ink-subtle'">{{ row[c.key] || "—" }}</span>
      </template>
      <template #empty="{ filtered }">
        <Button v-if="!filtered && editable" size="sm" @click="emit('create')">{{ cfg.newLabel }}</Button>
      </template>
    </ListTable>
  </div>
</template>
