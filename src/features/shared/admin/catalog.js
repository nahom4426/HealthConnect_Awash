import { administeredModules, isExactSuperAdmin } from "@/utils/roleAccess";

/** AuthService ModuleTypes.ALLOWED, plus the Super Admin "every module" scope. */
export const ADMIN_MODULES = [
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

/** Modules this caller may filter or assign. Super Admin gets the full catalog. */
export function moduleOptions(user) {
  const managed = administeredModules(user);
  if (managed == null) return ADMIN_MODULES;
  return ADMIN_MODULES.filter((item) => managed.includes(item.value));
}

/** List screens: Super Admin starts on every module; a module admin starts on their first module. */
export function defaultListModule(user) {
  if (isExactSuperAdmin(user)) return "all";
  const managed = administeredModules(user) || [];
  return managed[0] || "";
}

export function moduleLabel(value) {
  if (!value) return "";
  const match = ADMIN_MODULES.find((item) => item.value === value);
  return match ? match.label : value.charAt(0).toUpperCase() + value.slice(1);
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
