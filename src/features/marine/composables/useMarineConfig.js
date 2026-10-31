import { ref } from "vue";
import { getConfig } from "../api/marineApi";

/** Fail closed until GET /config answers. Inland, hull, and foreign currencies stay off. */
const CLOSED = Object.freeze({
  features: Object.freeze({
    hull: false,
    inlandTransit: false,
    openCovers: false,
    certificates: false,
    referrals: false,
  }),
  currencies: Object.freeze(["ETB"]),
  baseCurrency: "ETB",
  paymentRequired: false,
  paymentProvider: null,
  demoPayment: false,
  products: Object.freeze([]),
  fxSource: "MANUAL",
  fxRateType: "MID",
  fxMaxRateAgeDays: 1,
  fxAllowHistoricalRates: true,
  rolesEnforce: false,
});

const config = ref(CLOSED);
let request = null;

/** Loads GET /marine/v1/config once. A failed call leaves the closed defaults in place. */
export function loadMarineConfig() {
  if (!request) {
    request = getConfig().then((res) => {
      if (!res.ok || !res.data) return;
      const features = res.data.features ?? {};
      const currencies = Array.isArray(res.data.currencies) ? res.data.currencies.filter(Boolean) : [];
      config.value = {
        features: {
          hull: features.hull === true,
          inlandTransit: features.inlandTransit === true,
          openCovers: features.openCovers === true,
          certificates: features.certificates === true,
          referrals: features.referrals === true,
        },
        currencies: currencies.length ? currencies : ["ETB"],
        baseCurrency: res.data.baseCurrency || "ETB",
        paymentRequired: res.data.paymentRequired === true,
        paymentProvider: res.data.paymentProvider ?? null,
        demoPayment: res.data.demoPayment === true,
        products: Array.isArray(res.data.products) ? res.data.products : [],
        fxSource: res.data.fxSource || "MANUAL",
        fxRateType: res.data.fxRateType || "MID",
        fxMaxRateAgeDays: Number.isInteger(res.data.fxMaxRateAgeDays) ? res.data.fxMaxRateAgeDays : 1,
        fxAllowHistoricalRates: res.data.fxAllowHistoricalRates !== false,
        rolesEnforce: res.data.rolesEnforce === true,
      };
    });
  }
  return request;
}

export function useMarineConfig() {
  loadMarineConfig();
  return config;
}
