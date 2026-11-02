import { describe, it, expect } from 'vitest';
import { isCustomer, fullName } from '../session';
import { describeError, fieldErrorMap } from '../api';

describe('portal user', () => {
  it('treats CLIENT users and the CLIENT role as customers', () => {
    expect(isCustomer({ userType: 'CLIENT' })).toBe(true);
    expect(isCustomer({ roleName: 'client' })).toBe(true);
    expect(isCustomer({ userType: 'INSURANCE', roleName: 'Underwriter' })).toBe(false);
    expect(isCustomer(null)).toBe(false);
  });

  it('joins the name parts that exist', () => {
    expect(fullName({ firstName: 'Haben', fatherName: 'Gebre' })).toBe('Haben Gebre');
    expect(fullName({})).toBe('');
  });
});

describe('portal api errors', () => {
  it('prefers the field messages, then the detail', () => {
    const withFields = { response: { data: { detail: 'bad', fieldErrors: [{ field: 'incidentDate', message: 'Accident date is outside the policy period' }] } } };
    expect(describeError(withFields)).toBe('Accident date is outside the policy period');
    expect(describeError({ response: { data: { detail: 'Cannot move from A to B.' } } })).toBe('Cannot move from A to B.');
  });

  it('says so when the server cannot be reached', () => {
    expect(describeError({})).toMatch(/could not reach the server/i);
  });

  it('keys field errors by path', () => {
    const e = { response: { data: { fieldErrors: [{ field: 'notificationForm.policyHolder.phone', message: 'Phone is required' }] } } };
    expect(fieldErrorMap(e)).toEqual({ 'notificationForm.policyHolder.phone': 'Phone is required' });
  });
});

import { validateEthiopianPhone, cleanPhone } from '../validators';

describe('Ethiopian phone numbers (same rule as the mobile app)', () => {
  it('accepts the usual ways of writing a mobile number', () => {
    for (const ok of ['0912345678', '0712345678', '912345678', '+251912345678', '251 91 234 5678', '091-234-5678']) {
      expect(validateEthiopianPhone(ok)).toBeNull();
    }
  });

  it('rejects the rest with a message', () => {
    expect(validateEthiopianPhone('')).toMatch(/enter a phone number/i);
    for (const bad of ['0112345678', '12345', '09123456789', 'abc']) {
      expect(validateEthiopianPhone(bad)).toMatch(/valid phone number/i);
    }
  });

  it('strips spaces and dashes', () => {
    expect(cleanPhone('091 234-5678')).toBe('0912345678');
  });
});

import { formDate, lineValue, fit, block, pageContent, BLOCKS } from '../claimFormLayout';

describe('claim form layout (same positions as the mobile PDF)', () => {
  const form = {
    policyHolder: { fullName: 'Haben Gebre', phone: '0948560005' },
    vehicle: { policyNo: 'AWI-MOT-POL-1', plateNo: 'AA-3-B12345' },
    driver: { fullName: 'Haben Gebre', reasonForDriving: 'EMPLOYED', licenceIssueDate: '2019-05-12', licenceNo: 'AA-DL-1' },
    accident: { date: '2026-10-30', time: '14:20', place: 'Bole', responsible: 'Not sure yet', description: 'Hit from behind', otherParty: { ownerName: 'Selam' } },
    damage: { insuredVehicle: 'Rear bumper' },
    injuries: [{ name: 'Hanna', address: 'Bole 03', identity: '' }],
  };

  it('writes dates dd/mm/yyyy and maps the driving reason', () => {
    expect(formDate('2026-10-30')).toBe('30/10/2026');
    expect(lineValue(form, 'd.issue')).toBe('12/05/2019');
    expect(lineValue(form, 'd.reason')).toBe('Employed');
    expect(lineValue({ driver: { reasonForDriving: 'OTHER', reasonOther: 'Friend' } }, 'd.reason')).toBe('Friend');
  });

  it('leaves "Not sure yet" blank', () => {
    expect(lineValue(form, 'a.responsible')).toBe('');
  });

  it('shrinks a long answer to fit its blank and cuts it when it still does not', () => {
    const short = fit('Bole', 100, 200, 100);
    expect(short.size).toBe(9);
    expect(short.left).toBe(102);
    const long = fit('A very long answer that cannot possibly fit on this short blank line', 100, 200, 60);
    expect(long.size).toBe(5.5);
    expect(long.text.endsWith('…')).toBe(true);
  });

  it('puts the answers on the right pages', () => {
    const c = pageContent(form);
    expect(c.lines[1].length).toBeGreaterThan(5);        // holder, vehicle, driver, accident on page 1
    expect(c.lines[2].some((x) => x.text === 'Selam')).toBe(true); // other party on page 2
    expect(c.lines[2].some((x) => x.text === 'Hanna')).toBe(true); // injured person on page 2
    expect(c.blocks.map((b) => b.text)).toContain('Hit from behind');
  });

  it('keeps long block text inside its ruled lines', () => {
    const b = block('x'.repeat(5000), BLOCKS.description);
    expect(b.size).toBeGreaterThanOrEqual(6.5);
    expect(b.text.length).toBeLessThan(5000);
  });
});
