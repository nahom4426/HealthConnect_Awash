// Class strings shared by the marine form controls, so every input looks and focuses the same.
export const inputClass =
  "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink placeholder:text-ink-subtle focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-muted disabled:text-ink-muted";
export const inputBorder = (error) => (error ? "border-error" : "border-line");
// marine-card (theme.css) adds the glass background, 20px radius, shadow and section-title accent
export const cardClass = "marine-card rounded-2xl border bg-surface border-line shadow-card";
