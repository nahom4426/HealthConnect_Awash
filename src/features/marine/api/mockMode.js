// Whether the in-browser mock backend answers Marine calls. Kept free of imports so the sidebar
// and router can read it without pulling in the HTTP client (which would make an import cycle
// through ApiService → auth store → router → MainLayout).
const setting = import.meta.env.VITE_MARINE_MOCK;
export const marineMockEnabled = setting === undefined ? !!import.meta.env.DEV : setting === "true";
