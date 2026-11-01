import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

const user = { firstName: 'Abebe', roleName: 'Underwriter', privileges: [] };
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ auth: { user }, logout: () => {} }) }));

// By default the user holds Life and Fire, plus one no-code product; no Health, no Travel
const BASE_MODULES = [
  { key: 'life', name: 'Life Insurance', roleName: 'Life Underwriter', sortOrder: 1 },
  { key: 'fire', name: 'Fire Insurance', roleName: 'Fire Officer', sortOrder: 2 },
  { key: 'pet_care', name: 'Pet Care', description: 'Vet bills for pets.', serviceId: 'property-casualty', sortOrder: 3 },
];
let myModules = BASE_MODULES;
vi.mock('@/features/products/api/modulesApi', () => ({ fetchMyModules: async () => myModules }));
// A catalogue product (Pet Care) makes the launcher load the product definitions
vi.mock('@/features/products/api/productsApi', () => ({ listDefinitions: async () => [] }));

// Claims across products for the Dashboard, and the Life service's summary
let claims = [];
vi.mock('@/features/motor/claims/api/digitalChannelApi', () => ({ fetchAllClaims: async () => claims }));
let lifeSummary = { success: false };
vi.mock('@/features/life/api/dashboardApi', () => ({ getDashboardSummary: async () => lifeSummary }));

import ModuleLauncher from '../ModuleLauncher.vue';

async function mountAt(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/module-select', component: ModuleLauncher },
      { path: '/:rest(.*)*', component: { template: '<div />' } },
    ],
  });
  router.push(path);
  await router.isReady();
  // chart.js needs a canvas, which jsdom lacks; the charts' data is checked through their props
  const wrapper = mount(ModuleLauncher, { global: { plugins: [router], stubs: { LineChart: true, BarChart: true } } });
  await flushPromises();
  return { wrapper, router };
}

const cards = (wrapper) => wrapper.findAll('article');
const cardNames = (wrapper) => cards(wrapper).map((c) => c.find('h4').text());
const card = (wrapper, name) => cards(wrapper).find((c) => c.find('h4').text() === name);
// "label · count" of each category tab; the hint is its tooltip
const tabs = (wrapper) =>
  wrapper.findAll('[aria-label="Product categories"] button').map((b) => {
    const parts = b.findAll('span').map((s) => s.text()).filter(Boolean);
    return `${parts[0]} · ${parts[1]}`;
  });

describe('ModuleLauncher', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    myModules = BASE_MODULES;
    claims = [];
    lifeSummary = { success: false };
    user.roleName = 'Underwriter';
    user.privileges = ['ROLE_Analytics'];
  });

  it('switches between Dashboard, Reports and Products', async () => {
    const { wrapper } = await mountAt('/module-select');
    const views = wrapper.findAll('[aria-label="Launcher sections"] button').map((b) => b.text());
    expect(views).toEqual(['Dashboard', 'Reports', 'Products']);
    expect(cards(wrapper)).toHaveLength(0);
  });

  it('shows claim statistics across products on the Dashboard', async () => {
    claims = [
      { claimUuid: 'c1', claimNumber: 'CLM-1', productModule: 'fire', status: 'SUBMITTED', estimatedAmount: 1000, createdAt: '2026-10-30T10:00:00' },
      { claimUuid: 'c2', claimNumber: 'CLM-2', productModule: 'fire', status: 'HANDOVER_COMPLETED', approvedAmount: 2500, estimatedAmount: 9000, createdAt: '2026-10-31T10:00:00' },
      { claimUuid: 'c3', claimNumber: 'CLM-3', productModule: 'motor', status: 'REJECTED', estimatedAmount: 500, createdAt: '2026-10-29T10:00:00' },
    ];
    const { wrapper } = await mountAt('/module-select');
    const kpi = (label) => wrapper.findAll('p').find((p) => p.text() === label).element.nextElementSibling.textContent;
    expect(kpi('Claims filed')).toBe('3');
    expect(kpi('Open claims')).toBe('1');
    expect(kpi('Completed')).toBe('1');
    expect(kpi('Claimed amount')).toBe('ETB 4K');

    // Busiest product first, named as the registry names it
    const byProduct = wrapper.find('[aria-labelledby="stats-by-product"]').findAll('li')
      .map((li) => li.findAll('div:first-child > span').map((span) => span.text()).join(' | '));
    expect(byProduct).toEqual(['Fire Insurance | 2 · ETB 3.5K', 'Motor | 1 · ETB 500']);
    expect(wrapper.find('[aria-labelledby="stats-recent"]').findAll('li')[0].text()).toContain('CLM-2');
  });

  it('filters the figures by module tab, and by clicking a product bar', async () => {
    claims = [
      { claimUuid: 'c1', productModule: 'fire', status: 'SUBMITTED', estimatedAmount: 1000 },
      { claimUuid: 'c2', productModule: 'fire', status: 'HANDOVER_COMPLETED', approvedAmount: 2500 },
      { claimUuid: 'c3', productModule: 'motor', status: 'REJECTED', estimatedAmount: 500 },
    ];
    const { wrapper, router } = await mountAt('/module-select');
    const statTabs = () => wrapper.findAll('[aria-label="Filter statistics by module"] button');
    // Busiest first; Life files its claims elsewhere, so it gets no tab
    expect(statTabs().map((b) => b.text().replace(/\s+/g, ' '))).toEqual(['All modules 3', 'Fire Insurance 2', 'Motor 1', 'Pet Care 0']);
    const kpi = (label) => wrapper.findAll('p').find((p) => p.text() === label).element.nextElementSibling.textContent;

    await statTabs()[2].trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.module).toBe('motor');
    expect(kpi('Claims filed')).toBe('1');
    expect(kpi('Open claims')).toBe('0');

    // Clicking the Fire bar switches to Fire; clicking it again goes back to all modules
    const fireBar = () => wrapper.find('[aria-labelledby="stats-by-product"]').findAll('button')[0];
    await fireBar().trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.module).toBe('fire');
    expect(kpi('Claims filed')).toBe('2');
    await fireBar().trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.module).toBeUndefined();
  });

  it('charts claims over time, amount by product and status by product', async () => {
    const thisMonth = new Date().toISOString();
    claims = [
      { claimUuid: 'c1', productModule: 'fire', status: 'SUBMITTED', estimatedAmount: 1000, createdAt: thisMonth },
      { claimUuid: 'c2', productModule: 'fire', status: 'HANDOVER_COMPLETED', approvedAmount: 2500, createdAt: thisMonth, updatedAt: thisMonth },
      { claimUuid: 'c3', productModule: 'motor', status: 'REJECTED', estimatedAmount: 500, createdAt: thisMonth },
    ];
    const { wrapper } = await mountAt('/module-select');
    const trend = wrapper.findComponent({ name: 'LineChart' }).props('chartData');
    expect(trend.labels).toHaveLength(6);
    expect(trend.datasets.map((d) => [d.label, d.data.at(-1)])).toEqual([['Filed', 3], ['Completed', 1]]);

    const [amount, status] = wrapper.findAllComponents({ name: 'BarChart' }).map((c) => c.props('chartData'));
    expect(amount.labels).toEqual(['Fire Insurance', 'Motor']);
    expect(amount.datasets[0].data).toEqual([3500, 500]);
    expect(status.datasets.map((d) => [d.label, d.data])).toEqual([['Open', [1, 0]], ['Completed', [1, 0]], ['Rejected', [0, 1]]]);
  });

  it('shows the Life summary only when the Life service returns it', async () => {
    const { wrapper: without } = await mountAt('/module-select');
    expect(without.find('#stats-life').exists()).toBe(false);

    lifeSummary = { success: true, data: { grossWrittenPremium: 1250000, premiumCollected: 900000, claimsPaid: 40000 } };
    const { wrapper } = await mountAt('/module-select');
    expect(wrapper.find('[aria-labelledby="stats-life"]').findAll('dt').map((d) => d.text())).toEqual([
      'Gross written premium',
      'Premium collected',
      'Claims paid',
    ]);
    expect(wrapper.find('[aria-labelledby="stats-life"]').text()).toContain('ETB 1.3M');
  });

  it('opens a module from the Dashboard', async () => {
    const { wrapper, router } = await mountAt('/module-select');
    const fire = wrapper.find('[aria-labelledby="stats-modules"]').findAll('button').find((b) => b.text().includes('Fire Insurance'));
    await fire.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/fire/dashboard');
  });

  it('puts life, medical and travel under Life, and the registry modules under Non-Life', async () => {
    const { wrapper } = await mountAt('/module-select?view=products');
    expect(tabs(wrapper)).toEqual([
      'All products · 11',
      'Life · 9',
      'Non-Life · 2',
    ]);
    expect(wrapper.findAll('section h3').map((h) => h.text().replace(/\s+/g, ' '))).toEqual([
      'Life · Life assurance',
      'Life · Medical & travel insurance',
      'Non-Life · Property & liability',
    ]);
  });

  it('lists the life products, medical and travel on the Life tab', async () => {
    const { wrapper } = await mountAt('/module-select?view=products&category=life');
    expect(cardNames(wrapper)).toEqual([
      'Term Assurance',
      'Endowment Assurance',
      'Anticipated Endowment',
      'Children’s Education Endowment',
      'Whole Life Assurance',
      'Mortgage Redemption Insurance',
      'Riders (Supplementary Contracts)',
      'Medical Insurance',
      'World Wide Travel Insurance',
    ]);
    expect(card(wrapper, 'Term Assurance').text()).toContain('Modified Large Group');
    expect(card(wrapper, 'Medical Insurance').text()).toContain('No access to Medical');
    expect(card(wrapper, 'World Wide Travel Insurance').text()).toContain('Not set up yet');
  });

  it('narrows a category to one product group, and clears the filters', async () => {
    const { wrapper, router } = await mountAt('/module-select?view=products&category=life');
    const groupTabs = () => wrapper.findAll('[aria-label="Product groups"] button');
    expect(groupTabs().map((b) => b.text().replace(/\s+/g, ' '))).toEqual([
      'All groups 9',
      'Life assurance 7',
      'Medical & travel insurance 2',
    ]);

    await groupTabs()[2].trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.group).toBe('medical-travel');
    expect(cardNames(wrapper)).toEqual(['Medical Insurance', 'World Wide Travel Insurance']);
    expect(wrapper.text()).toContain('Showing 2 products');

    // Another category starts again from all of its groups
    await wrapper.findAll('[aria-label="Product categories"] button')[2].trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.group).toBeUndefined();
    expect(cardNames(wrapper)).toEqual(['Fire Insurance', 'Pet Care']);

    await wrapper.findAll('button').find((b) => b.text() === 'Clear filters').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.category).toBeUndefined();
    expect(cards(wrapper)).toHaveLength(11);
  });

  it('filters products by name or plan', async () => {
    const { wrapper } = await mountAt('/module-select?view=products');
    await wrapper.find('input[type="search"]').setValue('modified large');
    expect(cardNames(wrapper)).toEqual(['Term Assurance']);
    await wrapper.find('input[type="search"]').setValue('zzz');
    expect(wrapper.text()).toContain('No products match');
  });

  it('starts a Life quotation for the chosen product when the user may create one', async () => {
    user.privileges = ['ROLE_Life_Quotation_Create'];
    const { wrapper, router } = await mountAt('/module-select?view=products&category=life');
    const term = card(wrapper, 'Endowment Assurance');
    expect(term.text()).toContain('Get a quote');
    await term.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/life/quotations/new?product=ENDOWMENT_ASSURANCE');
    expect(localStorage.getItem('activeModule')).toBe('life');
  });

  it('opens the Life module instead when the user cannot create quotations', async () => {
    const { wrapper, router } = await mountAt('/module-select?view=products&category=life');
    await card(wrapper, 'Term Assurance').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/life/dashboard');
  });

  it('opens the Travel product once it exists in the registry', async () => {
    myModules = [...BASE_MODULES, { key: 'travel', name: 'Travel', serviceId: 'property-casualty', sortOrder: 4 }];
    const { wrapper, router } = await mountAt('/module-select?view=products&category=life');
    await card(wrapper, 'World Wide Travel Insurance').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/products/TRAVEL/proposals');
  });

  it('opens a non-life registry product', async () => {
    const { wrapper, router } = await mountAt('/module-select?view=products&category=non-life');
    expect(cardNames(wrapper)).toEqual(['Fire Insurance', 'Pet Care']);
    await card(wrapper, 'Pet Care').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/products/PET_CARE/proposals');
  });

  it('shows card skeletons while the modules load', async () => {
    myModules = new Promise(() => {});
    const { wrapper: dashboard } = await mountAt('/module-select');
    expect(dashboard.find('[role="status"]').text()).toBe('Loading your modules…');
    expect(dashboard.findAll('.sk-card')).toHaveLength(6);
    expect(dashboard.find('.sk').exists()).toBe(true);

    const { wrapper: products } = await mountAt('/module-select?view=products');
    expect(products.findAll('.sk-card')).toHaveLength(6);
    expect(cards(products)).toHaveLength(0);
  });

  it('offers Add new, to the product catalogue, only to a Super Admin', async () => {
    const addNew = (wrapper) => wrapper.findAll('button').find((b) => b.text() === 'Add new');
    const { wrapper: underwriter } = await mountAt('/module-select?view=products');
    expect(addNew(underwriter)).toBeUndefined();

    localStorage.setItem('userDetail', JSON.stringify({ user: { roleName: 'Super Admin' } }));
    const { wrapper, router } = await mountAt('/module-select?view=products');
    await addNew(wrapper).trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/product-catalogue');
  });

  it('shows only the reports the user holds a privilege for', async () => {
    const { wrapper } = await mountAt('/module-select?view=reports');
    expect(wrapper.findAll('h3').map((h) => h.text())).toEqual(['Utilization report', 'Report center']);
  });
});
