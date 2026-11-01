// Every module uses the Standard Insurance brand blue across the launcher (Dashboard tiles, tabs,
// charts, Products cards); modules are told apart by their art, icon and name. `hex` is the light
// brand blue used for fills, bars and dots; `deep` is the brand navy for text and icons on it.
// Cards and buttons take translucent tints of `hex`, so they stay light on a white page and quiet
// on the dark theme.
import { withAlpha } from '@/config/chartPalette';

/** Standard Insurance brand: light blue #4A92D6 for tints, navy #0D4F80 for text and icons */
const BRAND = { hex: '#4A92D6', deep: '#0D4F80' };

export const MODULE_THEMES = {
  motor: { ...BRAND, art: 'motor' },
  fire: { ...BRAND, art: 'fire' },
  health: { ...BRAND, art: 'health' },
  marine: { ...BRAND, art: 'marine' },
  travel: { ...BRAND, art: 'travel' },
  life: { ...BRAND, art: 'life' },
  engineering: { ...BRAND, art: 'engineering' },
  liability: { ...BRAND, art: 'liability' },
  burglary: { ...BRAND, art: 'burglary' },
};

/** No-code products from the catalogue */
export const PRODUCT_THEME = { ...BRAND, art: 'product' };
/** Tools such as User Management and the Product catalogue */
export const TOOL_THEME = { ...BRAND, art: 'tool' };

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
