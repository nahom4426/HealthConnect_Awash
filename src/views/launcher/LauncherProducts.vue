<script setup>
// Products view of the launcher: the fixed product list plus every other module the user can
// open, filtered by Life / Non-Life tabs, a tab per product group, and a search. Life products
// start a group quotation. Category and group are kept in the URL (?category=life&group=medical-travel).
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ADMIN_MODULE_ID, useModuleStore } from '@/stores/moduleStore';
import { lifeCan } from '@/features/life/privileges';
import { PRODUCT_CATEGORIES, PRODUCT_GROUPS, STATIC_PRODUCTS } from '@/config/productCategories';
import { MODULE_THEMES, cardStyle, softStyle, themeOf } from './moduleThemes';
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

// Groups of the chosen category; a group from another category falls back to all of them
const groupTabs = computed(() => PRODUCT_GROUPS.filter((g) => activeCategory.value === 'all' || g.category === activeCategory.value));
const activeGroup = computed(() => (groupTabs.value.some((g) => g.id === route.query.group) ? route.query.group : 'all'));

function setCategory(category) {
  router.replace({ query: { ...route.query, category: category === 'all' ? undefined : category, group: undefined } });
}

function setGroup(group) {
  router.replace({ query: { ...route.query, group: group === 'all' ? undefined : group } });
}

// Each category tab in its own soft colour; the selected one is washed with it
const CATEGORY_THEMES = {
  all: { hex: '#93c5fd', deep: '#03396c' },
  life: MODULE_THEMES.life,
  'non-life': MODULE_THEMES.motor,
};
const categoryTabStyle = (id) => ({ ...cardStyle(CATEGORY_THEMES[id]), borderColor: CATEGORY_THEMES[id].hex, color: CATEGORY_THEMES[id].deep });

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

const products = computed(() => {
  const modulesById = Object.fromEntries(props.modules.map((mod) => [mod.id, mod]));
  const fixed = STATIC_PRODUCTS.map((p) => {
    const mod = modulesById[p.moduleId] || null;
    return { ...p, key: p.id, category: categoryOfGroup[p.group], theme: MODULE_THEMES[p.moduleId], action: actionFor(p, mod) };
  });
  const fromModules = props.modules
    .filter((mod) => mod.kind !== 'tool' && mod.id !== ADMIN_MODULE_ID && !STATIC_MODULE_IDS.has(mod.id))
    .map((mod) => ({
      key: `module:${mod.id}`,
      name: props.titleOf(mod),
      description: props.descriptionOf(mod) || 'Proposals, quotations and policies for this product.',
      plans: [],
      group: 'general',
      category: 'non-life',
      icon: mod.icon,
      theme: themeOf(mod),
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

function groupCount(groupId) {
  return products.value.filter(
    (p) => groupTabs.value.some((g) => g.id === p.group) && (groupId === 'all' || p.group === groupId) && matches(p),
  ).length;
}

const sections = computed(() =>
  groupTabs.value
    .filter((g) => activeGroup.value === 'all' || g.id === activeGroup.value)
    .map((g) => ({ ...g, products: products.value.filter((p) => p.group === g.id && matches(p)) }))
    .filter((s) => s.products.length),
);

const shownCount = computed(() => sections.value.reduce((n, s) => n + s.products.length, 0));
const filtered = computed(() => activeCategory.value !== 'all' || activeGroup.value !== 'all' || !!term.value);
function clearFilters() {
  search.value = '';
  router.replace({ query: { ...route.query, category: undefined, group: undefined } });
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
    <!-- Row 1: category tabs, search and Add new -->
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
            'group flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            activeCategory === category.id
              ? 'shadow-soft'
              : 'border-line bg-white text-ink hover:-translate-y-px hover:border-primary/30 hover:shadow-soft',
          ]"
          :style="activeCategory === category.id ? categoryTabStyle(category.id) : undefined"
          @click="setCategory(category.id)"
        >
          <span
            :class="[
              'grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 [&>svg]:h-4 [&>svg]:w-4',
              activeCategory === category.id ? 'bg-white/80' : '',
            ]"
            :style="activeCategory === category.id ? { color: CATEGORY_THEMES[category.id].deep } : softStyle(CATEGORY_THEMES[category.id])"
            v-html="CATEGORY_ICONS[category.id]"
          ></span>
          <span class="text-sm font-extrabold leading-none">{{ category.label }}</span>
          <span
            :class="[
              'rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
              activeCategory === category.id ? 'bg-white/80' : 'bg-surface-raised text-ink-muted',
            ]"
          >{{ countFor(category.id) }}</span>
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

    <!-- Row 2: group tabs, and how many products are shown -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div class="-mx-1 max-w-full overflow-x-auto px-1">
        <div class="inline-flex w-max gap-0.5 rounded-xl border border-line bg-white p-0.5" role="tablist" aria-label="Product groups">
          <button
            v-for="tab in [{ id: 'all', label: 'All groups' }, ...groupTabs]"
            :key="tab.id"
            type="button"
            role="tab"
            :aria-selected="activeGroup === tab.id"
            :class="[
              'inline-flex items-center gap-1.5 rounded-[0.6rem] px-3 py-1.5 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              activeGroup === tab.id ? 'bg-primary/10 text-primary ring-1 ring-primary/25' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
            ]"
            @click="setGroup(tab.id)"
          >
            {{ tab.label }}
            <span :class="['rounded-full px-1.5 text-[10px] tabular-nums', activeGroup === tab.id ? 'bg-white/80' : 'bg-surface-raised']">{{ groupCount(tab.id) }}</span>
          </button>
        </div>
      </div>
      <p class="text-xs font-medium text-ink-subtle" aria-live="polite">
        Showing <strong class="text-ink">{{ shownCount }}</strong> {{ shownCount === 1 ? 'product' : 'products' }}
        <button v-if="filtered" type="button" class="ml-2 font-bold text-primary hover:underline" @click="clearFilters">Clear filters</button>
      </p>
    </div>

    <!-- Nothing matches -->
    <div v-if="!sections.length" class="rise rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
      <span class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-raised text-ink-subtle">
        <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      </span>
      <p class="text-sm font-bold text-ink">No products match “{{ search }}”</p>
      <p class="mt-1 text-xs text-ink-subtle">Try another name, or a plan such as Group or Individual.</p>
      <button type="button" class="mt-4 text-xs font-bold text-primary hover:underline" @click="search = ''">Clear search</button>
    </div>

    <!-- Products, by group; keyed by the tabs so the cards rise in again on every switch -->
    <div :key="`${activeCategory}|${activeGroup}`">
      <section v-for="section in sections" :key="section.id" class="mb-8" :aria-labelledby="`group-${section.id}`">
        <div class="mb-4 flex items-center gap-3">
          <h3 :id="`group-${section.id}`" class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-subtle whitespace-nowrap">
            <template v-if="activeCategory === 'all'">{{ section.category === 'life' ? 'Life' : 'Non-Life' }} · </template>{{ section.label }}
          </h3>
          <span class="h-px flex-1 bg-line"></span>
          <span class="text-[11px] font-semibold text-ink-subtle tabular-nums">{{ section.products.length }}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <article
            v-for="(product, index) in section.products"
            :key="product.key"
            :style="product.action.run ? { ...cardDelay(index), ...cardStyle(product.theme) } : cardDelay(index)"
            :class="[
              'rise group relative flex flex-col overflow-hidden rounded-2xl border p-5 transition-all duration-300',
              product.action.run ? 'cursor-pointer hover:-translate-y-1 hover:shadow-medium' : 'border-dashed border-line bg-surface-muted/60',
            ]"
            @click="product.action.run?.()"
          >
            <!-- Soft colour glow that grows on hover -->
            <span
              v-if="product.action.run"
              class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.18] transition-transform duration-500 group-hover:scale-150"
              :style="{ background: product.theme.hex }"
            ></span>

            <div class="relative mb-4 flex items-start justify-between gap-3">
              <span :class="['block h-16 w-24 shrink-0 transition-transform duration-300 group-hover:scale-110', !product.action.run && 'opacity-50 grayscale']">
                <ModuleArt :kind="product.art" />
              </span>
              <span class="rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider" :style="softStyle(product.theme)">
                {{ product.category === 'life' ? 'Life' : 'Non-Life' }}
              </span>
            </div>

            <h4 class="relative text-[1rem] font-extrabold leading-snug tracking-tight text-ink">{{ product.name }}</h4>
            <p class="relative mt-1.5 text-[0.8rem] font-medium leading-relaxed text-ink-muted line-clamp-3">{{ product.description }}</p>

            <ul v-if="product.plans.length" class="relative mt-4 flex flex-wrap gap-1.5" aria-label="Plans">
              <li
                v-for="plan in product.plans"
                :key="plan"
                class="rounded-lg border border-white bg-white/80 px-2 py-1 text-[10.5px] font-semibold text-ink-muted shadow-soft"
              >{{ plan }}</li>
            </ul>

            <div class="relative mt-auto flex items-center justify-between gap-3 pt-5">
              <template v-if="product.action.run">
                <span class="truncate text-[11px] font-medium text-ink-subtle">{{ product.note }}</span>
                <button
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 hover:brightness-95 group-hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  :style="softStyle(product.theme, 0.3)"
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
      </section>
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
