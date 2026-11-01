// One soft colour per module across the launcher (Dashboard tiles, tabs, charts, Products cards).
// `hex` is a light pastel used for fills, bars and dots; `deep` is the same hue dark enough for
// text and icons on that pastel. Cards and buttons take translucent tints of `hex`, so they stay
// light on a white page and quiet on the dark theme.
import { withAlpha } from '@/config/chartPalette';

export const MODULE_THEMES = {
  motor: { hex: '#60a5fa', deep: '#1d4ed8', art: 'motor' },
  fire: { hex: '#fbbf24', deep: '#b45309', art: 'fire' },
  health: { hex: '#34d399', deep: '#047857', art: 'health' },
  marine: { hex: '#38bdf8', deep: '#0369a1', art: 'marine' },
  travel: { hex: '#7dd3fc', deep: '#0369a1', art: 'travel' },
  life: { hex: '#fda4af', deep: '#be123c', art: 'life' },
  engineering: { hex: '#a78bfa', deep: '#6d28d9', art: 'engineering' },
  liability: { hex: '#5eead4', deep: '#0f766e', art: 'liability' },
  burglary: { hex: '#a5b4fc', deep: '#4338ca', art: 'burglary' },
};

/** No-code products from the catalogue */
export const PRODUCT_THEME = { hex: '#c4b5fd', deep: '#6d28d9', art: 'product' };
/** Tools such as User Management and the Product catalogue */
export const TOOL_THEME = { hex: '#cbd5e1', deep: '#334155', art: 'tool' };

/** Theme of a module tile ({ id, kind }); unknown modules get the product theme, tools the tool theme. */
export function themeOf(mod) {
  if (!mod) return TOOL_THEME;
  return MODULE_THEMES[mod.id] || (mod.kind === 'tool' || mod.kind === undefined ? TOOL_THEME : PRODUCT_THEME);
}

export const hexOf = (id) => (MODULE_THEMES[id] || PRODUCT_THEME).hex;
export const deepOf = (id) => (MODULE_THEMES[id] || PRODUCT_THEME).deep;

/* ── Inline styles from a theme ── */

/** A card washed with the theme's pastel, lighter towards the bottom. */
export const cardStyle = (theme) => ({
  background: `linear-gradient(160deg, ${withAlpha(theme.hex, 0.2)}, ${withAlpha(theme.hex, 0.05)} 70%)`,
  borderColor: withAlpha(theme.hex, 0.45),
});

/** A soft pill or button in the theme's colour. */
export const softStyle = (theme, strength = 0.22) => ({
  background: withAlpha(theme.hex, strength),
  color: theme.deep,
});
