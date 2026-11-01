<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import {
  getProposal,
  getVersion,
  issueQuotation,
  listQuotations,
  previewQuotation,
  submitProposal,
  withdrawProposal,
} from '../api/productsApi';
import { money, parseFormSchema, parseJson, schemaFields, statusTone, useProductContext } from '../productUtils';
import PremiumBreakdown from '../components/PremiumBreakdown.vue';
import '../products-ui.css';

const route = useRoute();
const router = useRouter();
const { productName, basePath, can } = useProductContext();

const proposalUuid = computed(() => route.params.proposalUuid);
const proposal = ref(null);
const version = ref(null);
const quotations = ref([]);
const preview = ref(null);
const previewError = ref('');
const loading = ref(false);
const working = ref('');
const error = ref('');

const answers = computed(() => parseJson(proposal.value?.answersJson, {}));
const answerRows = computed(() => {
  const fields = schemaFields(parseFormSchema(version.value?.schemaJson));
  const known = new Set(fields.map((f) => f.id));
  const rows = fields.map((f) => ({ id: f.id, label: f.label || f.id, value: display(answers.value[f.id], f) }));
  // Answers to questions no longer on the form still show, under their id
  for (const [id, value] of Object.entries(answers.value)) {
    if (!known.has(id)) rows.push({ id, label: id, value: display(value) });
  }
  return rows;
});
const perilLabel = (code) => version.value?.perils?.find((p) => p.code === code)?.label || code;
const itemLabel = (code) => version.value?.itemTypes?.find((t) => t.code === code)?.label || code;
const selectedPerils = computed(() => proposal.value?.selectedPerils || proposal.value?.perilCodes || []);
const status = computed(() => proposal.value?.status);

function display(value, field) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (field?.type === 'dropdown') {
    const option = (field.options || []).find((o) => (o?.value ?? o) === value);
    if (option?.label) return option.label;
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function loadPreview() {
  preview.value = null;
  previewError.value = '';
  if (!can('quotation.calculate')) return;
  if (!['DRAFT', 'SUBMITTED'].includes(status.value)) return;
  try {
    preview.value = await previewQuotation(proposalUuid.value);
  } catch (e) {
    previewError.value = e.message;
  }
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    proposal.value = await getProposal(proposalUuid.value);
    const [v, quotes] = await Promise.all([
      proposal.value.productUuid ? getVersion(proposal.value.productUuid).catch(() => null) : null,
      listQuotations({ proposalUuid: proposalUuid.value }).catch(() => null),
    ]);
    version.value = v;
    quotations.value = quotes?.content || (Array.isArray(quotes) ? quotes : []);
    await loadPreview();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function act(name, fn, done) {
  working.value = name;
  error.value = '';
  try {
    const result = await fn();
    await done?.(result);
  } catch (e) {
    error.value = e.message;
  } finally {
    working.value = '';
  }
}

function onSubmit() {
  act('submit', () => submitProposal(proposalUuid.value), async (next) => {
    proposal.value = next || (await getProposal(proposalUuid.value));
    toasted(true, 'Proposal submitted for quotation');
    await loadPreview();
  });
}

function onWithdraw() {
  act('withdraw', () => withdrawProposal(proposalUuid.value), async (next) => {
    proposal.value = next || (await getProposal(proposalUuid.value));
    preview.value = null;
    toasted(true, 'Proposal withdrawn');
  });
}

function onIssue() {
  act('issue', () => issueQuotation(proposalUuid.value), (quote) => {
    toasted(true, 'Quotation issued');
    router.push(`${basePath.value}/quotations/${quote.quotationUuid}`);
  });
}

watch(proposalUuid, load, { immediate: true });
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <button class="pp-link" @click="router.push(`${basePath}/proposals`)">← Proposals</button>
        <p class="pp-kicker" style="margin-top: .5rem">{{ productName }} · proposal</p>
        <h1>{{ proposal?.proposerName || 'Proposal' }}</h1>
        <p class="pp-sub mono" style="font-size: .75rem">{{ proposalUuid }}</p>
      </div>
      <div v-if="proposal" class="pp-actions">
        <button v-if="status === 'DRAFT' && can('proposal.update')" class="pp-btn ghost" @click="router.push(`${basePath}/proposals/${proposalUuid}/edit`)">Edit</button>
        <button
          v-if="['DRAFT', 'SUBMITTED'].includes(status) && (can('proposal.withdraw') || can('proposal.update'))"
          class="pp-btn danger"
          :disabled="Boolean(working)"
          @click="onWithdraw"
        >
          {{ working === 'withdraw' ? 'Withdrawing…' : 'Withdraw' }}
        </button>
        <button v-if="status === 'DRAFT' && can('proposal.submit')" class="pp-btn" :disabled="Boolean(working)" @click="onSubmit">
          {{ working === 'submit' ? 'Submitting…' : 'Submit for quotation' }}
        </button>
        <button v-if="status === 'SUBMITTED' && can('quotation.issue')" class="pp-btn" :disabled="Boolean(working)" @click="onIssue">
          {{ working === 'issue' ? 'Issuing…' : 'Issue quotation' }}
        </button>
      </div>
    </header>

    <p v-if="loading && !proposal" class="pp-note">Loading proposal…</p>
    <p v-if="error" class="pp-error">{{ error }}</p>

    <template v-if="proposal">
      <section class="pp-meta">
        <div><span>Status</span><strong><span class="pp-pill" :class="statusTone(status)">{{ status }}</span></strong></div>
        <div><span>Product version</span><strong>{{ proposal.productClass }} {{ proposal.productVersion || version?.version || '' }}</strong></div>
        <div><span>Period</span><strong>{{ String(proposal.periodFrom || '').slice(0, 10) }} → {{ String(proposal.periodTo || '').slice(0, 10) }}</strong></div>
        <div><span>Sum insured</span><strong>{{ money(proposal.totalSumInsured, version?.currency) }}</strong></div>
        <div v-if="preview"><span>Indicative premium</span><strong>{{ money(preview.totalPremium, preview.currency) }}</strong></div>
      </section>

      <div class="pp-split">
        <div>
          <section class="pp-card">
            <h2>Proposer</h2>
            <dl class="pp-dl">
              <div><dt>Name</dt><dd>{{ proposal.proposerName || '—' }}</dd></div>
              <div><dt>Phone</dt><dd>{{ proposal.proposerPhone || '—' }}</dd></div>
              <div><dt>Address</dt><dd>{{ proposal.proposerAddress || '—' }}</dd></div>
            </dl>
          </section>

          <section class="pp-card">
            <h2>Answers</h2>
            <dl v-if="answerRows.length" class="pp-dl">
              <div v-for="row in answerRows" :key="row.id"><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div>
            </dl>
            <p v-else class="muted">No answers were stored on this proposal.</p>
          </section>

          <section class="pp-card flush">
            <h2>Insured items</h2>
            <table>
              <thead><tr><th>Type</th><th>Description</th><th class="num">Sum insured</th></tr></thead>
              <tbody>
                <tr v-if="!proposal.riskItems?.length"><td colspan="3" class="muted">No items.</td></tr>
                <tr v-for="(item, i) in proposal.riskItems || []" :key="item.riskItemUuid || i">
                  <td>{{ itemLabel(item.itemType) }}</td>
                  <td>{{ item.description || '—' }}</td>
                  <td class="num">{{ money(item.sumInsured, version?.currency) }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="pp-card">
            <h2>Selected covers</h2>
            <p v-if="!selectedPerils.length" class="muted" style="margin: 0">No optional covers selected.</p>
            <div v-else class="pp-checks">
              <span v-for="code in selectedPerils" :key="code" class="pp-pill blue">{{ perilLabel(code) }}</span>
            </div>
          </section>
        </div>

        <div>
          <PremiumBreakdown v-if="preview" :result="preview" title="Quote preview" />
          <p v-else-if="previewError" class="pp-warn">The premium could not be calculated yet: {{ previewError }}</p>
          <p v-else-if="!can('quotation.calculate')" class="pp-note">You don't have permission to preview quotes.</p>

          <section class="pp-card flush">
            <h2>Quotations</h2>
            <table>
              <tbody>
                <tr v-if="!quotations.length"><td class="muted">No quotation issued yet.</td></tr>
                <tr v-for="q in quotations" :key="q.quotationUuid">
                  <td>
                    <button class="pp-link" @click="router.push(`${basePath}/quotations/${q.quotationUuid}`)">{{ q.quotationNumber || 'Quotation' }}</button>
                    <div class="muted">{{ money(q.totalPremium, q.currency) }}</div>
                  </td>
                  <td class="num"><span class="pp-pill" :class="statusTone(q.status)">{{ q.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
