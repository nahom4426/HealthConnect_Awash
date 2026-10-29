import { computed } from 'vue';
import { useRoute } from 'vue-router';

export const PC_MODULES = {
  fire: {
    id: 'fire',
    productClass: 'FIRE',
    basePath: '/fire',
    label: 'Fire',
    kicker: 'Fire',
    rateTitle: 'Fire rates & perils',
    rateSub: 'Construction × occupancy grid, loadings, and additional perils from the published Fire product. Quotation uses this snapshot.',
    axis1: 'Construction',
    axis2: 'Occupancy',
    formBuilderPath: '/form-builder/fire',
    productPath: '/fire/product',
    publishLabel: 'Publish to Fire proposal',
  },
  burglary: {
    id: 'burglary',
    productClass: 'BURGLARY',
    basePath: '/burglary',
    label: 'Burglary & Theft',
    kicker: 'Burglary & Theft',
    rateTitle: 'Burglary rates & covers',
    rateSub: 'Security grade × occupancy grid, loadings, and theft extensions from the published Burglary product. Quotation uses this snapshot.',
    axis1: 'Security grade',
    axis2: 'Occupancy',
    formBuilderPath: '/form-builder/burglary',
    productPath: '/burglary/product',
    publishLabel: 'Publish to Burglary proposal',
  },
};

export function usePcModule() {
  const route = useRoute();
  return computed(() => PC_MODULES[route.meta?.pcModule] || PC_MODULES.fire);
}

export function isPcProduct(productId) {
  return Boolean(PC_MODULES[productId]);
}

export function parseAnswers(json) {
  if (!json) return {};
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function ratingAxes(row) {
  const answers = parseAnswers(row?.answersJson);
  return {
    axis1: row?.premises?.constructionClass || answers.securityGrade || '—',
    axis2: row?.premises?.occupancyCode || answers.occupancyCode || '—',
  };
}
