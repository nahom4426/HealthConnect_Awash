import { ref } from 'vue';
import { toasted } from '@/utils/utils';
import { getInsuredPersons, getQuotedRiders } from '../api/quotationApi';
import { getIndividualRiderBenefits } from '../api/policyApi';
import { getCustomer } from '../api/customerApi';
import { getKnownRiders } from '../api/knownRiders';
import {
  downloadLifeClaimSettlementPdf,
  downloadLifeDebitNotePdf,
  downloadLifeIndividualPolicyPdf,
  downloadLifePolicySchedulePdf,
  downloadLifeQuotationPdf,
  downloadLifeReceiptPdf,
} from './lifeDocuments';

const rowsOf = (d) => (Array.isArray(d) ? d : Array.isArray(d?.content) ? d.content : []);

// Every member of a group quotation/policy, page by page (the list endpoint is paged).
async function allMembers(quotationUuid) {
  const limit = 200;
  const members = [];
  for (let page = 1; page <= 50; page++) {
    const res = await getInsuredPersons(quotationUuid, { page, limit });
    if (!res?.success) break;
    const rows = rowsOf(res.data);
    members.push(...rows);
    const meta = Array.isArray(res.data) ? rows[0] : res.data;
    if (rows.length < limit || page >= (Number(meta?.totalPages) || 1)) break;
  }
  return members;
}

async function riderNames() {
  const res = await getKnownRiders();
  const list = res?.success ? res.data || [] : [];
  return (id) => list.find((r) => r.riderUuid === id)?.riderName;
}

async function quotedRiders(quotationUuid) {
  const [res, name] = await Promise.all([getQuotedRiders({ quotationUuid }), riderNames()]);
  return (res?.success ? rowsOf(res.data) : []).map((r) => ({ ...r, riderName: r.riderName || name(r.riderUuid) }));
}

// PDF actions for the life pages. Each loads what its document needs (members, riders,
// policyholder) and reports failures without disturbing the page's own flow.
export function useLifePdfs() {
  const pending = ref('');

  async function run(kind, draw) {
    if (pending.value) return;
    pending.value = kind;
    try {
      await draw();
    } catch (e) {
      console.error(`${kind} PDF failed`, e);
      toasted(false, null, 'Could not generate the PDF');
    } finally {
      pending.value = '';
    }
  }

  const groupExtras = async (q) => {
    const [members, riders] = await Promise.all([allMembers(q.quotationUuid), quotedRiders(q.quotationUuid)]);
    return { members, riders };
  };

  return {
    pending,
    quotation: (q) => run('quotation', async () => downloadLifeQuotationPdf(q, await groupExtras(q))),
    debitNote: (q) => run('debitNote', async () => downloadLifeDebitNotePdf(q, { members: await allMembers(q.quotationUuid) })),
    receipt: (q, payment) => run('receipt', () => downloadLifeReceiptPdf(q, payment)),
    policySchedule: (q, detail = {}) => run('policySchedule', async () => downloadLifePolicySchedulePdf(q, { ...(await groupExtras(q)), detail })),
    individualPolicy: (b) => run('individualPolicy', async () => {
      const [ridersRes, name, customerRes] = await Promise.all([
        getIndividualRiderBenefits({ benefitUuid: b.benefitUuid }),
        riderNames(),
        b.customerUuid ? getCustomer(b.customerUuid) : null,
      ]);
      const riders = (ridersRes?.success ? rowsOf(ridersRes.data) : [])
        .filter((r) => !r.benefitUuid || r.benefitUuid === b.benefitUuid)
        .map((r) => ({ ...r, riderName: name(r.riderUuid) }));
      await downloadLifeIndividualPolicyPdf(b, { riders, customer: customerRes?.success ? customerRes.data || {} : {} });
    }),
    claimSettlement: (c) => run('claimSettlement', () => downloadLifeClaimSettlementPdf(c)),
  };
}
