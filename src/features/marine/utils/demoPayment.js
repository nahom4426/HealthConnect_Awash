export const DEMO_METHODS = [
  { value: "DEMO_TELEBIRR", label: "Demo Telebirr" },
  { value: "DEMO_BANK", label: "Demo bank transfer" },
  { value: "DEMO_CASH", label: "Demo cash" },
];

/** The demonstration panel is shown only after a real rating, and only when the API allows it. */
export function demoPaymentVisible(config, quote) {
  return config?.demoPayment === true && !!quote?.premium?.total;
}

export function demoMethodLabel(method) {
  return DEMO_METHODS.find((row) => row.value === method)?.label ?? method ?? "—";
}
