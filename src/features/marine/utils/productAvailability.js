/**
 * Whether a product radio can be chosen. Inland transit follows the config flag.
 * A missing or false flag leaves it unselectable.
 */
export function productSelectable(product, { inlandTransit = false, lockedProduct = false, draftProduct = "" } = {}) {
  if (!product) return false;
  if (product.value === "INLAND_TRANSIT" && inlandTransit !== true) return false;
  if (!product.phase || product.phase > 3) return false;
  if (lockedProduct && product.value !== draftProduct) return false;
  return true;
}
