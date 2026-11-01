<script setup>
// Products view of the launcher: the fixed product list plus every other module the user can
// open, filtered by the Life / Non-Life tabs and a search. Life products start a group quotation.
// The category is kept in the URL (?category=life). Cards are neutral: colour lives in the pictures.
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ADMIN_MODULE_ID, useModuleStore } from '@/stores/moduleStore';
import { lifeCan } from '@/features/life/privileges';
import { PRODUCT_CATEGORIES, PRODUCT_GROUPS, STATIC_PRODUCTS } from '@/config/productCategories';
import { themeOf } from './moduleThemes';
import ModuleArt from './ModuleArt.vue';

const props = defineProps({
  modules: { type: Array, default: () => [] },
  titleOf: { type: Function, default: (mod) => mod.name },
  descriptionOf: { type: Function, default: (mod) => mod.description },
});

const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();
const search = ref('');

const activeCategory = computed(() =>
  PRODUCT_CATEGORIES.some((c) => c.id === route.query.category) ? route.query.category : 'all',
);

function setCategory(category) {
  router.replace({ query: { ...route.query, category: category === 'all' ? undefined : category } });
}

const categoryOfGroup = Object.fromEntries(PRODUCT_GROUPS.map((g) => [g.id, g.category]));
const STATIC_MODULE_IDS = new Set(STATIC_PRODUCTS.map((p) => p.moduleId));

/** What clicking a product does: { label, run } when it can open, or { reason } when it can't. */
function actionFor(product, mod) {
  if (!mod) {
    if (product.moduleId === 'travel') return { reason: 'Not set up yet', setup: moduleStore.isSuperAdmin() };
    return { reason: `No access to ${product.moduleId === 'health' ? 'Medical' : 'Life'}` };
  }
  if (product.quote !== undefined && lifeCan('Life_Quotation_Create')) {
    return {
      label: 'Get a quote',
      run: () => {
        moduleStore.selectModule('life');
        router.push({ path: '/life/quotations/new', query: product.quote ? { product: product.quote } : {} });
      },
    };
  }
  return { label: 'Open', run: () => openModule(mod) };
}

const canAddProduct = computed(() => moduleStore.isSuperAdmin());

function addProduct() {
  moduleStore.selectModule(ADMIN_MODULE_ID);
  router.push('/product-catalogue');
}

function openModule(mod) {
  moduleStore.selectModule(mod.sidebarId || mod.id);
  router.push(mod.dashboardPath);
}

// Life products first, then medical and travel, then the registry's other modules
const products = computed(() => {
  const modulesById = Object.fromEntries(props.modules.map((mod) => [mod.id, mod]));
  const fixed = STATIC_PRODUCTS.map((p) => ({
    ...p,
    key: p.id,
    category: categoryOfGroup[p.group],
    action: actionFor(p, modulesById[p.moduleId] || null),
  }));
  const fromModules = props.modules
    .filter((mod) => mod.kind !== 'tool' && mod.id !== ADMIN_MODULE_ID && !STATIC_MODULE_IDS.has(mod.id))
    .map((mod) => ({
      key: `module:${mod.id}`,
      name: props.titleOf(mod),
      description: props.descriptionOf(mod) || 'Proposals, quotations and policies for this product.',
      plans: [],
      category: 'non-life',
      art: themeOf(mod).art,
      note: mod.kind === 'unavailable' ? 'Screens coming soon' : '',
      action: { label: 'Open', run: () => openModule(mod) },
    }));
  return [...fixed, ...fromModules];
});

const term = computed(() => search.value.trim().toLowerCase());
const matches = (p) =>
  !term.value || [p.name, p.description, ...p.plans].some((text) => String(text).toLowerCase().includes(term.value));

function countFor(categoryId) {
  return products.value.filter((p) => (categoryId === 'all' || p.category === categoryId) && matches(p)).length;
}

const shown = computed(() => products.value.filter((p) => (activeCategory.value === 'all' || p.category === activeCategory.value) && matches(p)));
const filtered = computed(() => activeCategory.value !== 'all' || !!term.value);
function clearFilters() {
  search.value = '';
  router.replace({ query: { ...route.query, category: undefined } });
}

// Cards rise in one after another, again whenever the tab changes
const cardDelay = (index) => ({ '--d': `${Math.min(index, 12) * 45}ms` });

const CATEGORY_ICONS = {
  all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  life: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z"/></svg>',
  'non-life': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6z"/></svg>',
};
</script>

<template>
  <div>
    <!-- Category tabs, search and Add new -->
    <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Product categories">
        <button
          v-for="category in PRODUCT_CATEGORIES"
          :key="category.id"
          type="button"
          role="tab"
          :title="category.hint"
          :aria-selected="activeCategory === category.id"
          :class="[
            'group flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            activeCategory === category.id
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-line bg-white text-ink hover:border-primary/30 hover:shadow-soft',
          ]"
          @click="setCategory(category.id)"
        >
          <span
            :class="[
              'grid h-7 w-7 shrink-0 place-items-center rounded-lg [&>svg]:h-4 [&>svg]:w-4',
              activeCategory === category.id ? 'bg-white/80 text-primary' : 'bg-surface-raised text-ink-muted',
            ]"
            v-html="CATEGORY_ICONS[category.id]"
          ></span>
          <span class="text-sm font-extrabold leading-none">{{ category.label }}</span>
          <span :class="['rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums', activeCategory === category.id ? 'bg-white/80' : 'bg-surface-raised text-ink-muted']">{{ countFor(category.id) }}</span>
        </button>
      </div>

      <div class="flex w-full gap-2 lg:w-auto">
        <label class="relative block flex-1 lg:w-72 lg:flex-none">
          <span class="sr-only">Search products</span>
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input
            v-model="search"
            type="search"
            placeholder="Search products or plans"
            class="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <!-- Only a Super Admin can create products in the catalogue -->
        <button
          v-if="canAddProduct"
          type="button"
          class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-bold text-white shadow-primary-sm transition-all hover:-translate-y-px hover:bg-primary-hover hover:shadow-primary-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          @click="addProduct"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add new
        </button>
      </div>
    </div>

    <p class="mb-5 text-xs font-medium text-ink-subtle" aria-live="polite">
      Showing <strong class="text-ink">{{ shown.length }}</strong> {{ shown.length === 1 ? 'product' : 'products' }}
      <button v-if="filtered" type="button" class="ml-2 font-bold text-primary hover:underline" @click="clearFilters">Clear filters</button>
    </p>

    <!-- Nothing matches -->
    <div v-if="!shown.length" class="rise rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <span class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-raised text-ink-subtle">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      </span>
      <p class="text-sm font-bold text-ink">No products match “{{ search }}”</p>
      <p class="mt-1 text-xs text-ink-subtle">Try another name, or a plan such as Group or Individual.</p>
      <button type="button" class="mt-4 text-xs font-bold text-primary hover:underline" @click="search = ''">Clear search</button>
    </div>

    <!-- Products; keyed by the tab so the cards rise in again on every switch -->
    <div :key="activeCategory" class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(product, index) in shown"
        :key="product.key"
        :style="cardDelay(index)"
        :class="[
          'rise group relative flex flex-col rounded-2xl border p-5 transition-all duration-300',
          product.action.run
            ? 'cursor-pointer border-line bg-white shadow-soft hover:-translate-y-1 hover:border-primary/30 hover:shadow-medium'
            : 'border-dashed border-line bg-surface-muted/60',
        ]"
        @click="product.action.run?.()"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <span :class="['block h-16 w-24 shrink-0 rounded-xl bg-surface-muted p-1.5 transition-transform duration-300 group-hover:scale-105', !product.action.run && 'opacity-50 grayscale']">
            <ModuleArt :kind="product.art" />
          </span>
          <span class="rounded-full bg-surface-raised px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink-muted">
            {{ product.category === 'life' ? 'Life' : 'Non-Life' }}
          </span>
        </div>

        <h4 class="text-[1rem] font-extrabold leading-snug tracking-tight text-ink">{{ product.name }}</h4>
        <p class="mt-1.5 text-[0.8rem] font-medium leading-relaxed text-ink-muted line-clamp-3">{{ product.description }}</p>

        <ul v-if="product.plans.length" class="mt-4 flex flex-wrap gap-1.5" aria-label="Plans">
          <li v-for="plan in product.plans" :key="plan" class="rounded-lg border border-line bg-surface-muted px-2 py-1 text-[10.5px] font-semibold text-ink-muted">{{ plan }}</li>
        </ul>

        <div class="mt-auto flex items-center justify-between gap-3 pt-5">
          <template v-if="product.action.run">
            <span class="truncate text-[11px] font-medium text-ink-subtle">{{ product.note }}</span>
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              @click.stop="product.action.run()"
            >
              {{ product.action.label }}
              <svg class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </template>
          <template v-else>
            <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-subtle">
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>
              {{ product.action.reason }}
            </span>
            <button
              v-if="product.action.setup"
              type="button"
              class="text-xs font-bold text-primary hover:underline"
              @click.stop="router.push('/product-catalogue')"
            >Set up →</button>
          </template>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
/* Cards rise in one after another; --d is each card's delay */
.rise {
  animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--d, 0ms);
}
@keyframes rise {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .rise { animation: none; }
}
</style>
