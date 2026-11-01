// Products shown on the launcher's Products view. Grouping follows standardinsurancesc.com:
// Life holds life assurance, medical and travel; Non-Life holds the property and liability
// modules from the registry (Motor, Fire, Marine, no-code products, ...).
//
// A product with `quote` opens a new Life group quotation with that product chosen;
// otherwise it opens the module named by `moduleId`. `art` names its animated picture
// (views/launcher/ModuleArt.vue).

export const PRODUCT_CATEGORIES = [
  { id: 'all', label: 'All products', hint: 'Everything we offer' },
  { id: 'life', label: 'Life', hint: 'Life, medical & travel' },
  { id: 'non-life', label: 'Non-Life', hint: 'Property & liability' },
];

export const PRODUCT_GROUPS = [
  { id: 'life-assurance', category: 'life', label: 'Life assurance' },
  { id: 'medical-travel', category: 'life', label: 'Medical & travel insurance' },
  { id: 'general', category: 'non-life', label: 'Property & liability' },
];

/** Life products a group quotation can be for, with their plan types. */
export const LIFE_QUOTE_PRODUCTS = [
  { value: 'TERM_ASSURANCE', label: 'Term Assurance', plans: ['Individual', 'Group', 'Modified Large Group'] },
  { value: 'ENDOWMENT_ASSURANCE', label: 'Endowment Assurance', plans: ['Individual', 'Group'] },
  { value: 'ANTICIPATED_ENDOWMENT', label: 'Anticipated Endowment', plans: [] },
  { value: 'CHILDRENS_EDUCATION_ENDOWMENT', label: 'Children’s Education Endowment', plans: [] },
  { value: 'WHOLE_LIFE_ASSURANCE', label: 'Whole Life Assurance', plans: [] },
  { value: 'MORTGAGE_REDEMPTION', label: 'Mortgage Redemption Insurance', plans: [] },
];

const quotePlans = (value) => LIFE_QUOTE_PRODUCTS.find((p) => p.value === value).plans;

const LIFE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 11c0 5.65-7 10-7 10z"/></svg>`;
const ENDOWMENT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M17 7.5C17 5.6 14.8 4.5 12 4.5S7 5.6 7 7.5 9.2 10.3 12 11s5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3"/></svg>`;
const CALENDAR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/></svg>`;
const EDUCATION_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>`;
const INFINITY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-2-2.7-3.6-4-5.5-4a4 4 0 000 8c1.9 0 3.5-1.3 5.5-4zm0 0c2 2.7 3.6 4 5.5 4a4 4 0 000-8c-1.9 0-3.5 1.3-5.5 4z"/></svg>`;
const HOME_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>`;
const SHIELD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5-4-1.3-7-5-7-9.5V6z"/><path d="M12 9v6M9 12h6"/></svg>`;
const MEDICAL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;
const TRAVEL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`;

export const STATIC_PRODUCTS = [
  {
    id: 'term-assurance',
    art: 'life',
    name: 'Term Assurance',
    description: 'Provides a death benefit if the life assured dies within the policy period.',
    plans: quotePlans('TERM_ASSURANCE'),
    group: 'life-assurance',
    moduleId: 'life',
    quote: 'TERM_ASSURANCE',
    icon: LIFE_ICON,
  },
  {
    id: 'endowment-assurance',
    art: 'endowment',
    name: 'Endowment Assurance',
    description: 'Pays a lump sum on death or at policy maturity, including cash surrender value and loan options.',
    plans: quotePlans('ENDOWMENT_ASSURANCE'),
    group: 'life-assurance',
    moduleId: 'life',
    quote: 'ENDOWMENT_ASSURANCE',
    icon: ENDOWMENT_ICON,
  },
  {
    id: 'anticipated-endowment',
    art: 'calendar',
    name: 'Anticipated Endowment',
    description: 'Offers a lump sum payout on maturity or death, and partial payouts during the policy term.',
    plans: [],
    group: 'life-assurance',
    moduleId: 'life',
    quote: 'ANTICIPATED_ENDOWMENT',
    icon: CALENDAR_ICON,
  },
  {
    id: 'childrens-education-endowment',
    art: 'education',
    name: 'Children’s Education Endowment',
    description: 'Secures a child’s future education with a lump sum payout at the end of the term or on the policyholder’s death.',
    plans: [],
    group: 'life-assurance',
    moduleId: 'life',
    quote: 'CHILDRENS_EDUCATION_ENDOWMENT',
    icon: EDUCATION_ICON,
  },
  {
    id: 'whole-life-assurance',
    art: 'infinity',
    name: 'Whole Life Assurance',
    description: 'Provides lifetime coverage with a payout upon the insured’s death, whenever that may be.',
    plans: [],
    group: 'life-assurance',
    moduleId: 'life',
    quote: 'WHOLE_LIFE_ASSURANCE',
    icon: INFINITY_ICON,
  },
  {
    id: 'mortgage-redemption',
    art: 'home',
    name: 'Mortgage Redemption Insurance',
    description: 'Covers the unpaid loan or mortgage repayments if the mortgagor (life assured) dies during the loan period.',
    plans: [],
    group: 'life-assurance',
    moduleId: 'life',
    quote: 'MORTGAGE_REDEMPTION',
    icon: HOME_ICON,
  },
  {
    // Riders are added to a quotation once it exists, so this starts a quotation without a product chosen
    id: 'riders',
    art: 'shield',
    name: 'Riders (Supplementary Contracts)',
    description: 'Optional add-ons to the basic cover, added to a quotation after it is created.',
    plans: ['Comprehensive Accident Insurance (CAI)', 'Funeral Expense', 'Critical Illness'],
    group: 'life-assurance',
    moduleId: 'life',
    quote: '',
    icon: SHIELD_ICON,
  },
  {
    id: 'medical-insurance',
    art: 'health',
    name: 'Medical Insurance',
    description: 'Group and individual medical cover that reimburses medical expenses due to illness or accident.',
    plans: ['Group', 'Individual'],
    group: 'medical-travel',
    moduleId: 'health',
    icon: MEDICAL_ICON,
  },
  {
    // Opens the registry's "travel" module: a no-code product with key TRAVEL gets proposal and quotation screens
    id: 'world-wide-travel',
    art: 'travel',
    name: 'World Wide Travel Insurance',
    description: 'Covers medical emergencies while the insured travels outside Ethiopia, including foreign visitors on a temporary stay.',
    plans: [],
    group: 'medical-travel',
    moduleId: 'travel',
    icon: TRAVEL_ICON,
  },
];
