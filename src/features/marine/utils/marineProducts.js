/** Products the API marked visible. Hidden products, including Hull while its flag is off, stay out. */
export function visibleProducts(products) {
  return (products ?? []).filter((product) => product?.visible === true);
}

/** A choice is valid only when that product is both visible and available. */
export function productChoiceValid(products, code) {
  return visibleProducts(products).some((product) => product.code === code && product.available === true);
}
