import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ auth: { user: { userUuid: 'u1', firstName: 'Sara', fatherName: 'Kebede' } } }) }));
vi.mock('@/utils/utils', () => ({ toasted: vi.fn() }));
vi.mock('@/features/health/institutions/api/institutionApi', () => ({
  getActiveInstitutions: async () => ({ data: [{ institutionUuid: 'i1', institutionName: 'Olam International LTD', state: 'Addis Ababa', telephone: '0911223344' }] }),
}));
const createQuotation = vi.fn(async () => ({ success: true, data: { quotationUuid: 'q9' } }));
vi.mock('../../api/quotationApi', () => ({ createQuotation: (...args) => createQuotation(...args), updateQuotation: vi.fn() }));

import QuotationNew from '../../pages/quotations/QuotationNew.vue';

async function mountAt(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/life/quotations/new', component: QuotationNew },
      { path: '/:rest(.*)*', component: { template: '<div />' } },
    ],
  });
  router.push(path);
  await router.isReady();
  const wrapper = mount(QuotationNew, { global: { plugins: [router] } });
  await new Promise((r) => setTimeout(r, 0));
  await flushPromises();
  return { wrapper, router };
}

const productCard = (wrapper, label) => wrapper.findAll('[aria-labelledby="q-product"] [role="radio"]').find((b) => b.text().includes(label));
const planButton = (wrapper, plan) => wrapper.findAll('[aria-labelledby="q-plan"] [role="radio"]').find((b) => b.text() === plan);

describe('New group quotation page', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    createQuotation.mockClear();
  });

  it('starts with the product the launcher card chose', async () => {
    const { wrapper } = await mountAt('/life/quotations/new?product=TERM_ASSURANCE');
    expect(productCard(wrapper, 'Term Assurance').attributes('aria-checked')).toBe('true');
    expect(wrapper.findAll('[aria-labelledby="q-plan"] [role="radio"]').map((b) => b.text())).toEqual(['Individual', 'Group', 'Modified Large Group']);
  });

  it('asks for what is missing instead of saving', async () => {
    const { wrapper } = await mountAt('/life/quotations/new');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.text()).toContain('Choose the product');
    expect(wrapper.text()).toContain('Choose the institution');
    expect(createQuotation).not.toHaveBeenCalled();
  });

  it('creates the draft with its product and plan, then opens it', async () => {
    const { wrapper, router } = await mountAt('/life/quotations/new?product=TERM_ASSURANCE');
    await planButton(wrapper, 'Modified Large Group').trigger('click');
    await wrapper.find('[aria-label="Institutions"] button').trigger('click');
    await wrapper.find('input[type="number"]').setValue('1');
    expect(wrapper.find('aside').text()).toContain('Olam International LTD');

    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(createQuotation).toHaveBeenCalledWith(expect.objectContaining({
      productType: 'TERM_ASSURANCE',
      planType: 'Modified_Large_Group',
      institutionUuid: 'i1',
      term: 1,
      contactPhone: '0911223344',
    }));
    expect(router.currentRoute.value.path).toBe('/life/quotations/q9');
  });
});
