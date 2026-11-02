// No-code property-casualty products: one set of screens for every product, keyed by its product
// key in the URL (/products/PET_CARE/...). Coded modules (Fire, Marine, Liability, ...) keep theirs.
const ProductCatalogue = () => import('@/features/products/pages/ProductCatalogue.vue');
const ProductCategories = () => import('@/features/products/pages/ProductCategories.vue');
const ProductDefinitionNew = () => import('@/features/products/pages/ProductDefinitionNew.vue');
const ProductVersions = () => import('@/features/products/pages/ProductVersions.vue');
const ProductVersionEditor = () => import('@/features/products/pages/ProductVersionEditor.vue');
const ProductProposals = () => import('@/features/products/pages/ProductProposals.vue');
const ProductProposalForm = () => import('@/features/products/pages/ProductProposalForm.vue');
const ProductProposalDetail = () => import('@/features/products/pages/ProductProposalDetail.vue');
const ProductQuotations = () => import('@/features/products/pages/ProductQuotations.vue');
const ProductQuotationDetail = () => import('@/features/products/pages/ProductQuotationDetail.vue');
const ModuleRegistry = () => import('@/features/products/pages/ModuleRegistry.vue');
const ComingSoon = () => import('@/features/products/pages/ComingSoon.vue');

const meta = { requiresAuth: true };
const base = '/products/:productClass';

export default [
  { path: '/product-catalogue', name: 'Product Catalogue', component: ProductCatalogue, meta: { ...meta, title: 'Product catalogue' } },
  { path: '/product-catalogue/new', name: 'New Product', component: ProductDefinitionNew, meta: { ...meta, title: 'New product' } },
  { path: '/product-categories', name: 'Product Categories', component: ProductCategories, meta: { ...meta, title: 'Product categories' } },
  { path: '/admin/modules', name: 'Module Registry', component: ModuleRegistry, meta: { ...meta, title: 'Module registry' } },
  { path: '/coming-soon/:moduleKey', name: 'Module Coming Soon', component: ComingSoon, meta },
  { path: `${base}/versions`, name: 'Product Versions', component: ProductVersions, meta: { ...meta, title: 'Product versions' } },
  { path: `${base}/versions/new`, name: 'Product Version New', component: ProductVersionEditor, meta: { ...meta, title: 'New version' } },
  { path: `${base}/versions/:productUuid`, name: 'Product Version', component: ProductVersionEditor, meta: { ...meta, title: 'Product version' } },
  { path: `${base}/proposals`, name: 'Product Proposals', component: ProductProposals, meta: { ...meta, title: 'Proposals' } },
  { path: `${base}/proposals/new`, name: 'Product Proposal New', component: ProductProposalForm, meta: { ...meta, title: 'New proposal' } },
  { path: `${base}/proposals/:proposalUuid/edit`, name: 'Product Proposal Edit', component: ProductProposalForm, meta: { ...meta, title: 'Edit proposal' } },
  { path: `${base}/proposals/:proposalUuid`, name: 'Product Proposal', component: ProductProposalDetail, meta: { ...meta, title: 'Proposal' } },
  { path: `${base}/quotations`, name: 'Product Quotations', component: ProductQuotations, meta: { ...meta, title: 'Quotations' } },
  { path: `${base}/quotations/:quotationUuid`, name: 'Product Quotation', component: ProductQuotationDetail, meta: { ...meta, title: 'Quotation' } },
];
