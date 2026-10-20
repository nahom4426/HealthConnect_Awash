/**
 * App-wide light / dark theme.
 *
 * - The theme lives on <html data-theme="light|dark">; every colour token in
 *   assets/wind.css switches from there.
 * - Light is the default. Picking a theme in the toggle saves it per browser.
 * - index.html sets the attribute before first paint, so there is no flash.
 * - Switching plays a circular reveal from the toggle (View Transitions API),
 *   or a short colour cross-fade where that isn't supported.
 */
import { computed, nextTick, ref } from "vue";

const STORAGE_KEY = "hc-theme";
const META_COLOURS = { light: "#4C3F3F", dark: "#161211" };

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — keep the choice for this visit only */
  }
}

const DEFAULT_THEME = "light";

/** Saved choice, or null when the user hasn't picked one yet. */
const preference = ref(readStored());

const theme = computed(() => preference.value ?? DEFAULT_THEME);
const isDark = computed(() => theme.value === "dark");

function applyToDocument(value) {
  const root = document.documentElement;
  if (root.dataset.theme === value) return;
  root.dataset.theme = value;
  root.style.colorScheme = value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOURS[value]);
  window.dispatchEvent(new CustomEvent("themechange", { detail: value }));
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let fadeTimer;
function crossFade() {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => root.classList.remove("theme-switching"), 400);
}

/**
 * Switch theme.
 * @param {"light"|"dark"} value
 * @param {{x:number, y:number}} [origin] viewport point the reveal grows from
 */
async function setTheme(value, origin) {
  if (value === theme.value) return;

  const commit = async () => {
    preference.value = value;
    writeStored(value);
    applyToDocument(value);
    await nextTick();
  };

  if (prefersReducedMotion()) {
    await commit();
    return;
  }

  if (!document.startViewTransition) {
    crossFade();
    await commit();
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? 0;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(commit);
  try {
    await transition.ready;
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  } catch {
    /* transition skipped (e.g. tab hidden) — the theme is applied either way */
  }
}

function toggleTheme(origin) {
  return setTheme(isDark.value ? "light" : "dark", origin);
}

let started = false;
/** Call once at startup (main.js). */
export function initTheme() {
  if (started) return;
  started = true;
  applyToDocument(theme.value);
  // Another tab changed the theme
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    preference.value = readStored();
    applyToDocument(theme.value);
  });
}

export function useTheme() {
  return { theme, isDark, preference, setTheme, toggleTheme };
}
