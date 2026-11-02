import { describe, it, expect } from 'vitest';
import { PAPER_FORMS, paperForm, formFields, blankValues, missingFields, paperPageContent } from '../paperClaimForms';

describe('paper claim forms', () => {
  it('has the three forms from standardinsurancesc.com besides motor', () => {
    expect(PAPER_FORMS.map((f) => f.id)).toEqual(['carriers-liability', 'cpm-car', 'workmens-compensation']);
    expect(paperForm('cpm-car').title).toBe('CPM & CAR');
    expect(paperForm('nope')).toBeNull();
  });

  it('places every answer on one of the form’s pages, inside the page', () => {
    for (const def of PAPER_FORMS) {
      const keys = new Set();
      for (const f of formFields(def)) {
        expect(keys.has(f.key), `${def.id} ${f.key} twice`).toBe(false);
        keys.add(f.key);
        const boxes = f.block ? [f.block] : [f.at, ...(f.also || [])];
        for (const [page, x, y, w] of boxes) {
          expect(page).toBeGreaterThanOrEqual(1);
          expect(page).toBeLessThanOrEqual(def.images.length);
          expect(x + w).toBeLessThanOrEqual(def.page.width);
          expect(y).toBeLessThan(def.page.height);
        }
      }
      for (const key of def.required) expect(keys.has(key), `${def.id} requires ${key}`).toBe(true);
    }
  });

  it('starts with the customer’s name and phone where the form asks for them', () => {
    const v = blankValues(paperForm('carriers-liability'), { name: 'Haben Gebre', phone: '0912345678' });
    expect(v['ph.name']).toBe('Haben Gebre');
    expect(v['ph.phone']).toBe('0912345678');
    expect(v['d.name']).toBe('');
  });

  it('lists the required answers left empty', () => {
    const def = paperForm('workmens-compensation');
    expect(missingFields(def, { employer: 'Acme', policyNo: ' ' })).toEqual(['policyNo', 'w.name', 'a.date']);
  });

  it('writes dates as on the paper, repeats names by the signatures, and runs long answers over the ruled lines', () => {
    const def = paperForm('carriers-liability');
    const pages = paperPageContent(def, { 'ph.name': 'Haben Gebre', 'a.date': '2026-10-30', 'a.description': 'Truck overturned near Adama' });
    expect(pages).toHaveLength(2);
    expect(pages[0].cells.map((c) => c.text)).toEqual(['Haben Gebre', '30/10/2026']);
    expect(pages[1].cells.map((c) => c.text)).toEqual(['Haben Gebre']);
    expect(pages[1].blocks).toHaveLength(1);
    expect(pages[1].blocks[0]).toMatchObject({ text: 'Truck overturned near Adama', lines: 2, indent: 0 });
  });
});
