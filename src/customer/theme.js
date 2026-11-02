// Light/dark for the customer site, sharing the saved choice with the staff app's key so a
// browser that already picked a theme keeps it. No store: just the <html> hooks the CSS reads.
const KEY = 'eic-dark-mode';

export function isDark() {
  try { return localStorage.getItem(KEY) === 'true'; } catch (e) { return false; }
}

export function applyTheme(dark) {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  try { localStorage.setItem(KEY, String(dark)); } catch (e) { /* the choice just won't persist */ }
}
