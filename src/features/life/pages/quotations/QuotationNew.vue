<script setup>
// New group quotation as a page: product and plan, institution, then term and contact, with a live
// summary beside the form. Opened from the Group quotations list and from the launcher's product
// cards, which preselect the product with ?product=TERM_ASSURANCE (and optionally &plan=Group).
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import { LIFE_QUOTE_PRODUCTS, STATIC_PRODUCTS } from "@/config/productCategories";
import ModuleArt from "@/views/launcher/ModuleArt.vue";
import { MODULE_THEMES, cardStyle, softStyle } from "@/views/launcher/moduleThemes";
import { useQuotationForm } from "../../quotations/useQuotationForm";

const route = useRoute();
const router = useRouter();

const requested = LIFE_QUOTE_PRODUCTS.find((p) => p.value === route.query.product);
const { form, errors, pending, plans, pickProduct, pickPlan, query, results, searching, pickInstitution, clearInstitution, submit } =
  useQuotationForm({ productType: requested?.value, planType: requested?.plans.includes(route.query.plan) ? route.query.plan : "" });

const theme = MODULE_THEMES.life;
// Each quotable product with its picture and description from the product list
const products = LIFE_QUOTE_PRODUCTS.map((p) => {
  const info = STATIC_PRODUCTS.find((s) => s.quote === p.value);
  return { ...p, art: info?.art || "life", description: info?.description || "" };
});
const chosen = computed(() => products.find((p) => p.value === form.productType));

const steps = computed(() => [
  { label: "Product", done: !!form.productType && (!plans.value.length || !!form.planType) },
  { label: "Institution", done: !!form.institutionUuid },
  { label: "Term & contact", done: !!form.term },
]);

async function create() {
  const saved = await submit();
  if (saved?.quotationUuid) router.push(`/life/quotations/${saved.quotationUuid}`);
  else if (saved) router.push("/life/quotations");
  else document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader
      title="New group quotation"
      back="/life/quotations"
      subtitle="Choose the product, then the institution and term. Members and riders are added on the next page."
    />

    <!-- Steps -->
    <ol class="mb-6 flex flex-wrap items-center gap-2" aria-label="Steps">
      <li v-for="(step, i) in steps" :key="step.label" class="flex items-center gap-2">
        <span
          :class="[
            'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-300',
            step.done ? 'border-transparent' : 'border-line bg-white text-ink-muted',
          ]"
          :style="step.done ? softStyle(theme, 0.3) : undefined"
        >
          <span class="grid h-5 w-5 place-items-center rounded-full bg-white/90 text-[10px]">
            <svg v-if="step.done" class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
            <template v-else>{{ i + 1 }}</template>
          </span>
          {{ step.label }}
        </span>
        <span v-if="i < steps.length - 1" class="h-px w-6 bg-line" aria-hidden="true"></span>
      </li>
    </ol>

    <form class="grid gap-6 lg:grid-cols-3" novalidate @submit.prevent="create">
      <div class="space-y-6 lg:col-span-2">
        <!-- 1 · Product and plan -->
        <section class="rounded-2xl border border-line bg-white p-5 shadow-soft" aria-labelledby="q-product">
          <h2 id="q-product" class="text-sm font-extrabold text-ink">1 · Product <span class="text-error">*</span></h2>
          <p class="mb-4 text-xs text-ink-subtle">Which life product is this quotation for?</p>
          <div role="radiogroup" aria-labelledby="q-product" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <button
              v-for="p in products"
              :key="p.value"
              type="button"
              role="radio"
              :aria-checked="form.productType === p.value"
              :class="[
                'group relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                form.productType === p.value ? 'shadow-medium' : 'border-line bg-white hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft',
              ]"
              :style="form.productType === p.value ? { ...cardStyle(theme), borderColor: theme.hex } : undefined"
              @click="pickProduct(p.value)"
            >
              <span v-if="form.productType === p.value" class="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full text-white" :style="{ background: theme.deep }">
                <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10" /></svg>
              </span>
              <span class="block h-12 w-16 transition-transform duration-300 group-hover:scale-110"><ModuleArt :kind="p.art" /></span>
              <span class="text-sm font-extrabold text-ink">{{ p.label }}</span>
              <span class="line-clamp-2 text-[11px] leading-relaxed text-ink-muted">{{ p.description }}</span>
            </button>
          </div>
          <p v-if="errors.productType" data-error class="mt-2 text-xs text-error">{{ errors.productType }}</p>

          <div v-if="plans.length" class="mt-5 border-t border-line pt-4">
            <span id="q-plan" class="text-sm font-bold text-ink">Plan <span class="text-error">*</span></span>
            <div role="radiogroup" aria-labelledby="q-plan" class="mt-2 flex flex-wrap gap-2">
              <button
                v-for="plan in plans"
                :key="plan"
                type="button"
                role="radio"
                :aria-checked="form.planType === plan"
                :class="[
                  'rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  form.planType === plan ? '' : 'border-line text-ink-muted hover:border-primary/30',
                ]"
                :style="form.planType === plan ? { ...softStyle(theme, 0.3), borderColor: theme.hex } : undefined"
                @click="pickPlan(plan)"
              >{{ plan }}</button>
            </div>
            <p v-if="errors.planType" data-error class="mt-2 text-xs text-error">{{ errors.planType }}</p>
          </div>
        </section>

        <!-- 2 · Institution -->
        <section class="rounded-2xl border border-line bg-white p-5 shadow-soft" aria-labelledby="q-institution">
          <h2 id="q-institution" class="text-sm font-extrabold text-ink">2 · Institution <span class="text-error">*</span></h2>
          <p class="mb-4 text-xs text-ink-subtle">The employer or organisation the group cover is for.</p>
          <div v-if="form.institutionUuid" class="flex items-center justify-between gap-3 rounded-xl border px-4 py-3" :style="{ ...cardStyle(theme), borderColor: theme.hex }">
            <span class="min-w-0">
              <span class="block truncate text-sm font-bold text-ink">{{ form.institutionName }}</span>
              <span class="text-[11px] text-ink-muted">Selected institution</span>
            </span>
            <button type="button" class="shrink-0 text-xs font-bold text-primary hover:underline" @click="clearInstitution">Change</button>
          </div>
          <div v-else class="grid gap-2">
            <TextField v-model="query" type="search" placeholder="Search institutions by name" aria-label="Search institutions" :error="errors.institutionUuid" />
            <span v-if="errors.institutionUuid" data-error class="sr-only">{{ errors.institutionUuid }}</span>
            <ul role="listbox" aria-label="Institutions" class="max-h-72 overflow-auto rounded-xl border border-line divide-y divide-line">
              <li v-if="searching" class="px-4 py-3 text-xs text-ink-subtle">Searching…</li>
              <li v-else-if="!results.length" class="px-4 py-3 text-xs text-ink-subtle">No active institutions found{{ query ? ` for “${query}”` : "" }}.</li>
              <li v-for="i in results" v-else :key="i.institutionUuid" role="option" :aria-selected="false">
                <button type="button" class="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted focus:bg-surface-muted focus:outline-none" @click="pickInstitution(i)">
                  <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black" :style="softStyle(theme, 0.3)">{{ (i.institutionName || "?").charAt(0) }}</span>
                  <span class="min-w-0">
                    <span class="block truncate text-sm text-ink">{{ i.institutionName }}</span>
                    <span v-if="i.address1 || i.state" class="block truncate text-xs text-ink-subtle">{{ [i.address1, i.state].filter(Boolean).join(", ") }}</span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </section>

        <!-- 3 · Term and contact -->
        <section class="rounded-2xl border border-line bg-white p-5 shadow-soft" aria-labelledby="q-details">
          <h2 id="q-details" class="text-sm font-extrabold text-ink">3 · Term & contact</h2>
          <p class="mb-4 text-xs text-ink-subtle">How long the cover runs, and who to talk to at the institution.</p>
          <div class="grid gap-4 sm:grid-cols-3">
            <TextField v-model="form.term" label="Term (years)" required type="number" min="1" step="1" inputmode="numeric" :error="errors.term" />
            <TextField v-model="form.contactPersonFullName" label="Contact person" maxlength="60" autocomplete="off" :error="errors.contactPersonFullName" />
            <TextField v-model="form.contactPhone" label="Contact phone" maxlength="13" type="tel" inputmode="tel" placeholder="+2519…" :error="errors.contactPhone" />
          </div>
          <span v-if="errors.term || errors.contactPhone || errors.contactPersonFullName" data-error class="sr-only">Check the term and contact details</span>
        </section>
      </div>

      <!-- Summary -->
      <aside class="lg:sticky lg:top-6 lg:self-start">
        <div class="overflow-hidden rounded-2xl border shadow-soft" :style="cardStyle(theme)">
          <div class="flex items-center gap-3 border-b border-white/60 p-5">
            <span class="block h-14 w-20 shrink-0"><ModuleArt :kind="chosen?.art || 'life'" /></span>
            <span class="min-w-0">
              <span class="block text-[11px] font-bold uppercase tracking-wider" :style="{ color: theme.deep }">Summary</span>
              <span class="block truncate text-sm font-extrabold text-ink">{{ chosen?.label || "No product chosen" }}</span>
            </span>
          </div>
          <dl class="space-y-3 bg-white/70 p-5 text-xs">
            <div class="flex justify-between gap-3"><dt class="text-ink-subtle">Plan</dt><dd class="text-right font-bold text-ink">{{ form.planType || (chosen && !plans.length ? "—" : "Not chosen") }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-ink-subtle">Institution</dt><dd class="truncate text-right font-bold text-ink">{{ form.institutionName || "Not chosen" }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-ink-subtle">Term</dt><dd class="text-right font-bold text-ink">{{ form.term ? `${form.term} yr${Number(form.term) === 1 ? "" : "s"}` : "—" }}</dd></div>
            <div class="flex justify-between gap-3"><dt class="text-ink-subtle">Contact</dt><dd class="truncate text-right font-bold text-ink">{{ form.contactPersonFullName || "—" }}</dd></div>
          </dl>
          <div class="space-y-2 bg-white/70 px-5 pb-5">
            <Button html-type="submit" full-width :pending="pending">Create draft</Button>
            <Button variant="outline" full-width @click="router.push('/life/quotations')">Cancel</Button>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-line bg-white p-5 text-xs shadow-soft">
          <p class="mb-3 font-extrabold text-ink">What happens next</p>
          <ol class="space-y-2.5 text-ink-muted">
            <li v-for="(next, i) in ['Add the members to be covered', 'Add riders and their sums assured', 'Issue the quotation to the client']" :key="next" class="flex items-start gap-2.5">
              <span class="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-black" :style="softStyle(theme, 0.3)">{{ i + 1 }}</span>
              {{ next }}
            </li>
          </ol>
        </div>
      </aside>
    </form>
  </div>
</template>
