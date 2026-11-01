import { administeredModules, isExactSuperAdmin } from "@/utils/roleAccess";
import { useModuleStore } from "@/stores/moduleStore";

/**
 * Used only when the server has no module registry yet (GET /modules/me answers 404).
 * Everywhere else the module list comes from the registry, so a new product's module
 * shows up in these dropdowns without a frontend change.
 */
const LEGACY_MODULES = [
  { value: "health", label: "Health" },
  { value: "life", label: "Life" },
  { value: "motor", label: "Motor" },
  { value: "fire", label: "Fire" },
  { value: "burglary", label: "Burglary" },
  { value: "marine", label: "Marine" },
  { value: "engineering", label: "Engineering" },
  { value: "liability", label: "Liability" },
  { value: "property", label: "Property" },
  { value: "accident", label: "Accident" },
  { value: "travel", label: "Travel" },
  { value: "surety", label: "Surety" },
  { value: "party", label: "Party" },
];

/** Every module the caller can see: { value: key, label: name }, in menu order. */
export function allModules() {
  const store = useModuleStore();
  if (store.registryStatus === "unavailable") return LEGACY_MODULES;
  // MainLayout loads the registry; these screens re-render once it arrives
  return store.registry.map((entry) => ({ value: entry.key, label: entry.name || entry.key }));
}

/** Modules this caller may filter or assign. Super Admin gets every module. */
export function moduleOptions(user) {
  const modules = allModules();
  const managed = administeredModules(user);
  if (managed == null) return modules;
  return modules.filter((item) => managed.includes(item.value));
}

/** List screens: Super Admin starts on every module; a module admin starts on their first module. */
export function defaultListModule(user) {
  if (isExactSuperAdmin(user)) return "all";
  const managed = administeredModules(user) || [];
  return managed[0] || "";
}

export function moduleLabel(value) {
  if (!value) return "";
  const match = allModules().find((item) => item.value === value);
  return match ? match.label : value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

/** Drop empty query values so the API keeps its defaults. */
export function catalogQuery(values = {}) {
  const query = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    query[key] = value;
  }
  return query;
}
