// The group quotation details form (QuotationRequest), shared by the New quotation page and the
// Edit quotation modal: product and plan, institution search, validation and saving.
// Institutions come from the shared institution service the health module uses.
import { computed, reactive, ref, watch } from "vue";
import { toasted } from "@/utils/utils";
import { useAuthStore } from "@/stores/auth";
import { getActiveInstitutions } from "@/features/health/institutions/api/institutionApi";
import { createQuotation, updateQuotation } from "../api/quotationApi";
import { fromQuotation, quotePlansFor, toQuotationRequest, validateQuotation } from "./quotationRules";

/**
 * @param {{ quotation?: object, productType?: string, planType?: string }} options
 *   `quotation` to edit one; productType/planType preselect the product of a new one.
 */
export function useQuotationForm({ quotation, productType, planType } = {}) {
  const editing = !!quotation?.quotationUuid;
  const auth = useAuthStore();

  const form = reactive(fromQuotation(quotation));
  if (!editing && productType) {
    form.productType = productType;
    form.planType = planType ?? "";
  }
  const errors = ref({});
  const pending = ref(false);

  const plans = computed(() => quotePlansFor(form.productType));
  // A plan only belongs to the product it was picked for
  watch(() => form.productType, () => {
    if (!plans.value.includes(form.planType)) form.planType = plans.value.length === 1 ? plans.value[0] : "";
    errors.value = { ...errors.value, productType: undefined, planType: undefined };
  });

  function pickProduct(value) {
    form.productType = value;
  }
  function pickPlan(plan) {
    form.planType = plan;
    errors.value = { ...errors.value, planType: undefined };
  }

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

  function pickInstitution(i) {
    form.institutionUuid = i.institutionUuid;
    form.institutionName = i.institutionName;
    if (!form.contactPhone && i.telephone) form.contactPhone = String(i.telephone).replace(/[^\d+]/g, "").slice(0, 13);
    errors.value = { ...errors.value, institutionUuid: undefined };
  }
  function clearInstitution() {
    form.institutionUuid = "";
    form.institutionName = "";
  }

  /** Validates and saves; resolves to the saved quotation (or true), or null when nothing was saved. */
  async function submit() {
    errors.value = validateQuotation(form, { creating: !editing });
    if (Object.keys(errors.value).length) return null;
    pending.value = true;
    const user = auth.auth?.user ?? auth.auth;
    const res = editing
      ? await updateQuotation(quotation.quotationUuid, toQuotationRequest(form, user, quotation.quotationStatus))
      : await createQuotation(toQuotationRequest(form, user));
    pending.value = false;
    if (!res?.success) return null;
    toasted(true, editing ? "Quotation updated" : "Draft quotation created");
    return res.data || true;
  }

  return {
    editing,
    form,
    errors,
    pending,
    plans,
    pickProduct,
    pickPlan,
    query,
    results,
    searching,
    pickInstitution,
    clearInstitution,
    submit,
  };
}
