// vue-i18n for Marine & Cargo (plan section 9, "Localisation"). English is the default; the draft
// Amharic strings are offered only when VITE_MARINE_AMHARIC=true. The language choice is kept per
// browser.
import { createI18n } from "vue-i18n";
import en from "./en";
import am from "./am";

const KEY = "marine.locale";
const amharic = import.meta.env.VITE_MARINE_AMHARIC === "true";

export const LOCALES = [{ code: "en", label: "English" }, ...(amharic ? [{ code: "am", label: "አማርኛ (draft)" }] : [])];

function saved() {
  try {
    const v = localStorage.getItem(KEY);
    return LOCALES.some((l) => l.code === v) ? v : "en";
  } catch {
    return "en";
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: saved(),
  fallbackLocale: "en",
  messages: { en, am },
});

export function setLocale(code) {
  i18n.global.locale.value = code;
  document.documentElement.lang = code;
  try {
    localStorage.setItem(KEY, code);
  } catch {
    /* per-browser convenience only */
  }
}

/** Status label in the current language; unknown statuses fall back to sentence case. */
export function statusLabel(status) {
  const key = `status.${status}`;
  if (i18n.global.te(key)) return i18n.global.t(key);
  const s = String(status || "—").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
