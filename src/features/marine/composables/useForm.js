import { reactive, ref } from "vue";

/**
 * Form state with per-field rules. Field errors show on blur and on submit; a 422 from the
 * server lands on the same fields (plan section 1, "Error handling").
 *
 * @param {object} initial  field values
 * @param {Record<string, (value: any, form: object) => string>} rules  "" = valid
 * @param {Record<string, string>} labels  field names for the error banner
 */
export function useForm(initial, rules = {}, labels = {}) {
  const form = reactive(structuredClone(initial));
  const errors = ref({});
  const submitted = ref(false);
  const pending = ref(false);

  function check(name) {
    // Before the first submit, leaving an empty field says nothing; "required" waits for submit
    const msg = !submitted.value && isEmpty(form[name]) ? "" : rules[name]?.(form[name], form) ?? "";
    const next = { ...errors.value };
    if (msg) next[name] = msg;
    else delete next[name];
    errors.value = next;
    return !msg;
  }

  function validate() {
    submitted.value = true;
    const e = {};
    for (const [name, rule] of Object.entries(rules)) {
      const msg = rule(form[name], form);
      if (msg) e[name] = msg;
    }
    errors.value = e;
    return !Object.keys(e).length;
  }

  /** Maps an ApiError's fields onto the form; returns true when it was a field error. */
  function applyServerError(error) {
    if (error?.status !== 422 || !error.fields?.length) return false;
    submitted.value = true;
    errors.value = Object.fromEntries(error.fields.map((f) => [f.field, f.message]));
    return true;
  }

  const bannerItems = () => Object.entries(errors.value).map(([field, message]) => ({ field, label: labels[field] ?? field, message }));

  return { form, errors, submitted, pending, check, validate, applyServerError, bannerItems };
}

/** Moves focus to a field's control (the error banner's links use this). */
export function focusField(name) {
  const el = document.querySelector(`[data-field="${CSS.escape(name)}"]`);
  const control = el?.querySelector("input:not([type=hidden]), select, textarea, button");
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
  control?.focus({ preventScroll: true });
}

export const isEmpty = (v) => v === null || v === undefined || String(v).trim() === "" || (Array.isArray(v) && !v.length);

// Small rule helpers
export const required = (label) => (v) => (v === null || v === undefined || String(v).trim() === "" || (Array.isArray(v) && !v.length) ? `${label} is required` : "");
export const emailRule = (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Enter a valid email" : "");
