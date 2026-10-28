<script setup>
// Create or edit a group quotation's details (QuotationRequest). Institutions come from the shared
// institution service the health module uses. data: { quotation?: QuotationResponse }
import { reactive, ref, watch } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { useAuthStore } from "@/stores/auth";
import { getActiveInstitutions } from "@/features/health/institutions/api/institutionApi";
import { createQuotation, updateQuotation } from "../api/quotationApi";
import { fromQuotation, toQuotationRequest, validateQuotation } from "../quotations/quotationRules";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const current = props.data?.quotation;
const editing = !!current?.quotationUuid;
const auth = useAuthStore();

const form = reactive(fromQuotation(current));
const errors = ref({});
const pending = ref(false);

// Institution search
const query = ref("");
const results = ref([]);
const searching = ref(false);
let timer, seq = 0;
async function searchInstitutions() {
  const mine = ++seq;
  searching.value = true;
  const res = await getActiveInstitutions({ page: 0, limit: 20, search: query.value.trim(), status: "ACTIVE" });
  if (mine !== seq) return;
  const d = res?.data;
  results.value = Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : [];
  searching.value = false;
}
watch(query, () => { clearTimeout(timer); timer = setTimeout(searchInstitutions, 300); });
if (!editing) searchInstitutions();

function pick(i) {
  form.institutionUuid = i.institutionUuid;
  form.institutionName = i.institutionName;
  if (!form.contactPhone && i.telephone) form.contactPhone = String(i.telephone).replace(/[^\d+]/g, "").slice(0, 13);
  errors.value = { ...errors.value, institutionUuid: undefined };
}
function clearInstitution() {
  form.institutionUuid = "";
  form.institutionName = "";
}

async function submit() {
  errors.value = validateQuotation(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const user = auth.auth?.user ?? auth.auth;
  const res = editing
    ? await updateQuotation(current.quotationUuid, toQuotationRequest(form, user, current.quotationStatus))
    : await createQuotation(toQuotationRequest(form, user));
  pending.value = false;
  if (res?.success) {
    toasted(true, editing ? "Quotation updated" : "Draft quotation created");
    closeModal(res.data || true);
  }
}

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit quotation' : 'New group quotation'" :subtitle="editing ? current.quotationNumber : 'Start a draft; members and riders are added next.'">
      <form id="life-quotation-form" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <div class="flex flex-col gap-1 text-sm font-medium text-ink">
          Institution
          <div v-if="form.institutionUuid" class="flex gap-3 justify-between items-center px-3 h-10 rounded-lg border border-primary bg-primary/5">
            <span class="truncate">{{ form.institutionName }}</span>
            <button v-if="!editing" type="button" class="text-xs font-semibold text-primary hover:underline" @click="clearInstitution">Change</button>
          </div>
          <template v-else>
            <input v-model="query" v-focus="true" type="search" placeholder="Search institutions" aria-label="Search institutions" :class="[field, errors.institutionUuid ? 'border-error' : 'border-line']" />
            <ul role="listbox" aria-label="Institutions" class="overflow-auto max-h-48 rounded-lg border divide-y border-line divide-line">
              <li v-if="searching" class="px-3 py-2.5 text-xs text-ink-subtle">Searching…</li>
              <li v-else-if="!results.length" class="px-3 py-2.5 text-xs text-ink-subtle">No active institutions found{{ query ? ` for “${query}”` : "" }}.</li>
              <li v-for="i in results" v-else :key="i.institutionUuid" role="option" :aria-selected="false">
                <button type="button" class="px-3 py-2 w-full text-sm text-left hover:bg-surface-muted focus:bg-surface-muted focus:outline-none" @click="pick(i)">
                  {{ i.institutionName }}
                  <span v-if="i.address1 || i.state" class="block text-xs text-ink-subtle">{{ [i.address1, i.state].filter(Boolean).join(", ") }}</span>
                </button>
              </li>
            </ul>
          </template>
          <span v-if="errors.institutionUuid" class="text-xs text-error">{{ errors.institutionUuid }}</span>
        </div>

        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Term (years)
          <input v-model="form.term" type="number" min="1" step="1" inputmode="numeric" :class="[field, 'w-32', errors.term ? 'border-error' : 'border-line']" />
          <span v-if="errors.term" class="text-xs text-error">{{ errors.term }}</span>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Contact person
            <input v-model="form.contactPersonFullName" maxlength="60" autocomplete="off" :class="[field, errors.contactPersonFullName ? 'border-error' : 'border-line']" />
            <span v-if="errors.contactPersonFullName" class="text-xs text-error">{{ errors.contactPersonFullName }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-medium text-ink">
            Contact phone
            <input v-model="form.contactPhone" maxlength="13" type="tel" inputmode="tel" placeholder="+2519…" :class="[field, errors.contactPhone ? 'border-error' : 'border-line']" />
            <span v-if="errors.contactPhone" class="text-xs text-error">{{ errors.contactPhone }}</span>
          </label>
        </div>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-quotation-form" :pending="pending">{{ editing ? "Save changes" : "Create draft" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
