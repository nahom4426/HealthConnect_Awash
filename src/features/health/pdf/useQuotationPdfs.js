import { ref } from 'vue';
import { getQuotationById } from '@/features/health/quotation/api/quotationApi';
import { toasted } from '@/utils/utils';
import { downloadDebitNotePdf, downloadPremiumReceiptPdf } from './healthDocuments';

// PDF buttons on quotation list rows. A list row lacks the packages and payment breakdown,
// so the full quotation is read first; the row's own fields fill anything it doesn't return.
export function useQuotationPdfs() {
  const pending = ref(null); // `${kind}:${quotationUuid}` while generating

  async function run(kind, row, draw) {
    const uuid = row?.quotationUuid || row?.id;
    if (!uuid || pending.value) return;
    pending.value = `${kind}:${uuid}`;
    try {
      let full = {};
      try {
        const resp = await getQuotationById(uuid);
        full = resp?.data || {};
      } catch (e) {
        console.error('Could not load quotation details for PDF', e);
      }
      await draw({ ...row, ...full });
    } catch (e) {
      console.error(`${kind} PDF failed`, e);
      toasted(false, null, 'Could not generate the PDF');
    } finally {
      pending.value = null;
    }
  }

  const isPending = (kind, row) => pending.value === `${kind}:${row?.quotationUuid || row?.id}`;
  const debitNote = (row) => run('debitNote', row, (q) => downloadDebitNotePdf(q));
  const receipt = (row) => run('receipt', row, (q) => downloadPremiumReceiptPdf(q));

  return { pending, isPending, debitNote, receipt };
}
